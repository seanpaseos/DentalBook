import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Download, Calendar, TrendingUp, Users, DollarSign, Clock, TrendingDown } from 'lucide-react';
import jsPDF from 'jspdf';
import { Appointment } from '../../types';
import { getAppointments } from '../../services/firestore';
import html2canvas from 'html2canvas';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ReportsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const appointmentsData = await getAppointments();
      const approvedAppointments = appointmentsData.filter(apt => apt.status !== 'pending');
      setAppointments(approvedAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRevenue = (appointments: Appointment[]) => {
    return appointments
      .filter(apt => apt.status === 'completed')
      .reduce((total, apt) => {
        const price = apt.procedurePrice || apt.price || 0;
        return total + (price * (apt.occurrences || 1));
      }, 0);
  };

  const getProcedureDistribution = (appointments: Appointment[]) => {
    const distribution = appointments.reduce((acc: { [key: string]: number }, apt) => {
      acc[apt.procedureType] = (acc[apt.procedureType] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value
    }));
  };

  const getStatusDistribution = (appointments: Appointment[]) => {
    const distribution = appointments.reduce((acc: { [key: string]: number }, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value
    }));
  };

  const getMonthlyRevenue = (appointments: Appointment[]) => {
    const monthlyData = appointments
      .filter(apt => apt.status === 'completed')
      .reduce((acc: { [key: string]: number }, apt) => {
        const date = new Date(apt.date);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        const price = apt.procedurePrice || apt.price || 0;
        acc[monthYear] = (acc[monthYear] || 0) + (price * (apt.occurrences || 1));
        return acc;
      }, {});

    return Object.entries(monthlyData).map(([name, value]) => ({
      name,
      revenue: value
    }));
  };

  type DateString = string;
  const isWithinRange = (date: DateString) => {
    if (startDate && endDate) {
      return date >= startDate && date <= endDate;
    } else if (startDate) {
      return date >= startDate;
    } else if (endDate) {
      return date <= endDate;
    }
    return true;
  };
  const filteredAppointments = appointments.filter(apt => isWithinRange(apt.date));
  const totalRevenue = calculateRevenue(filteredAppointments);
  const procedureDistribution = getProcedureDistribution(filteredAppointments);
  const statusDistribution = getStatusDistribution(filteredAppointments);
  const monthlyRevenue = getMonthlyRevenue(filteredAppointments);

  const calculateMetrics = () => {
    const completedAppointments = filteredAppointments.filter(apt => apt.status === 'completed');
    const totalRevenue = completedAppointments.reduce((sum, apt) => {
      const price = apt.procedurePrice || apt.price || 0;
      return sum + (price * (apt.occurrences || 1));
    }, 0);
    const totalAppointments = filteredAppointments.length;
    const completionRate = totalAppointments > 0 ? (completedAppointments.length / totalAppointments) * 100 : 0;
    const activeClients = new Set(completedAppointments.map(apt => apt.patientId)).size;

    const statusBreakdown = {
      completed: filteredAppointments.filter(apt => apt.status === 'completed').length,
      scheduled: filteredAppointments.filter(apt => apt.status === 'scheduled').length,
      cancelled: filteredAppointments.filter(apt => apt.status === 'cancelled').length,
      'no-show': filteredAppointments.filter(apt => apt.status === 'no-show').length,
      rescheduled: filteredAppointments.filter(apt => apt.status === 'rescheduled').length,
    };

    return {
      totalRevenue,
      totalAppointments,
      completionRate,
      activeClients,
      statusBreakdown
    };
  };

  const getRevenueOverview = () => {
    const monthlyRevenue: { [key: string]: number } = {};
    filteredAppointments
      .filter(apt => apt.status === 'completed')
      .forEach(apt => {
        const month = new Date(apt.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        const price = apt.procedurePrice || apt.price || 0;
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (price * (apt.occurrences || 1));
      });
    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }));
  };

  const exportToPDF = async () => {
    const doc = new jsPDF();
    const metrics = calculateMetrics();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = 20;

    // Set document properties
    doc.setProperties({
      title: 'DentalBook - Financial Report',
      subject: 'Dental Practice Financial Report',
      author: 'DentalBook',
      keywords: 'dental, report, financial, appointments',
      creator: 'DentalBook'
    });

    // Add header with logo and title
    doc.setFontSize(24);
    doc.setTextColor(13, 148, 136); // Teal color
    doc.setFont('helvetica', 'bold');
    doc.text('DentalBook', margin, yPos);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); // Black color
    doc.setFont('helvetica', 'normal');
    yPos += 10;
    doc.text('Financial Report', margin, yPos);
    
    // Report date range
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    yPos += 8;
    doc.text(`Report Period: ${startDate || 'Start Date'} to ${endDate || 'End Date'}`, margin, yPos);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, yPos, { align: 'right' });
    
    // Add a line separator
    yPos += 8;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 15;

    // Key Metrics Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Performance Indicators', margin, yPos);
    yPos += 10;
    
    // Key Metrics Table
    const metricsData = [
      { label: 'Total Revenue', value: `₱${metrics.totalRevenue.toLocaleString()}` },
      { label: 'Total Appointments', value: metrics.totalAppointments },
      { label: 'Completion Rate', value: `${metrics.completionRate.toFixed(1)}%` },
      { label: 'Active Clients', value: metrics.activeClients }
    ];
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Draw metrics table
    metricsData.forEach((item, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 12, 'F');
      }
      
      doc.text(item.label, margin + 5, yPos + 3);
      doc.text(item.value.toString(), pageWidth - margin - 5, yPos + 3, { align: 'right' });
      yPos += 8;
    });
    
    yPos += 10;
    
    // Status Breakdown Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Appointment Status Breakdown', margin, yPos);
    yPos += 10;
    
    // Status Breakdown Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Status', margin + 5, yPos + 3);
    doc.text('Count', pageWidth - margin - 15, yPos + 3, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    yPos += 8;
    
    Object.entries(metrics.statusBreakdown).forEach(([status, count], index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, yPos - 3, pageWidth - (margin * 2), 10, 'F');
      }
      
      const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
      doc.text(formattedStatus, margin + 5, yPos + 3);
      doc.text(count.toString(), pageWidth - margin - 5, yPos + 3, { align: 'right' });
      yPos += 7;
    });
    
    yPos += 15;
    
    // Add Revenue Chart
    const revenueChart = document.querySelector('.recharts-wrapper') as HTMLElement;
    if (revenueChart) {
      try {
        if (yPos > 180) {
          doc.addPage();
          yPos = 20;
        } else {
          yPos += 10;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Revenue Overview', margin, yPos);
        yPos += 10;
        
        const canvas = await html2canvas(revenueChart, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 10;
      } catch (error) {
        console.error('Error adding revenue chart:', error);
      }
    }
    
    // Add Procedure Distribution Chart
    const procedureChart = document.querySelectorAll('.recharts-wrapper')[1] as HTMLElement;
    if (procedureChart) {
      try {
        if (yPos > 180) {
          doc.addPage();
          yPos = 20;
        } else {
          yPos += 10;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Procedure Distribution', margin, yPos);
        yPos += 10;
        
        const canvas = await html2canvas(procedureChart, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', margin, yPos, imgWidth, Math.min(imgHeight, 150));
      } catch (error) {
        console.error('Error adding procedure chart:', error);
      }
    }

    // Procedure Distribution List
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Procedure Distribution Details:', margin, 20);
    doc.setFontSize(12);
    yPos = 35;
    getProcedureDistribution(filteredAppointments).forEach(({ name, value }) => {
      doc.text(`${name}: ${value}`, margin, yPos);
      yPos += 10;
    });

    doc.save(
      `dental-report-${startDate ? startDate : '...'} to ${endDate ? endDate : '...'}.pdf`
    );
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Reports</h2>
          <p className="text-sm text-gray-600">View practice analytics and insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            max={endDate || new Date().toISOString().split('T')[0]}
            placeholder="Start date"
          />
          <span className="text-gray-500 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            min={startDate}
            max={new Date().toISOString().split('T')[0]}
            placeholder="End date"
          />
          <button
            onClick={exportToPDF}
            className="flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors duration-200"
          >
            <Download className="w-4 h-4 mr-1" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-lg font-semibold text-gray-800">₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="p-2 bg-teal-100 rounded-lg">
              <span className="text-teal-600 font-semibold">₱</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Appointments</p>
              <p className="text-lg font-semibold text-gray-800">{filteredAppointments.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Unique Patients</p>
              <p className="text-lg font-semibold text-gray-800">{new Set(filteredAppointments.filter(apt => apt.status === 'completed').map(apt => apt.patientName)).size}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Avg. Revenue</p>
              <p className="text-lg font-semibold text-gray-800">₱{(totalRevenue / (filteredAppointments.filter(apt => apt.status === 'completed').length || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {/* Monthly Revenue Chart */}
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Monthly Revenue</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Procedure Distribution Chart */}
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Procedure Distribution</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={procedureDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {procedureDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointment Status Chart */}
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Appointment Status</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Additional Metrics</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Most Common Procedure</p>
              <p className="text-sm font-medium text-gray-800">{procedureDistribution.length > 0 ? procedureDistribution[0].name : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Completion Rate</p>
              <p className="text-sm font-medium text-gray-800">{metrics.completionRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Average Appointment Duration</p>
              <p className="text-sm font-medium text-gray-800">45 minutes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
