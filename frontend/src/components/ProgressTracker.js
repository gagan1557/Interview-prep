import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';
import '../styles/ProgressTracker.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

const ProgressTracker = () => {
  // Analytics tabs
  const [activeTab, setActiveTab] = useState('progress');

  // Mock data - in a real app, this would come from your API/database
  const [progressData] = useState({
    overallScore: 82,
    trend: 'up',
    metrics: [
      { name: 'Clarity', current: 85, previous: 78, trend: 'up' },
      { name: 'Confidence', current: 78, previous: 72, trend: 'up' },
      { name: 'Structure', current: 90, previous: 85, trend: 'up' },
      { name: 'Technical Depth', current: 82, previous: 75, trend: 'up' },
    ],
    practiceHistory: [
      { date: '2024-02-18', score: 82 },
      { date: '2024-02-15', score: 78 },
      { date: '2024-02-12', score: 75 },
      { date: '2024-02-08', score: 70 },
      { date: '2024-02-04', score: 65 },
      { date: '2024-01-28', score: 62 },
    ],
    responseTimeData: {
      labels: ['Jan 28', 'Feb 4', 'Feb 8', 'Feb 12', 'Feb 15', 'Feb 18'],
      datasets: [
        {
          label: 'Average Response Time (seconds)',
          data: [35, 32, 28, 25, 22, 18],
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
        },
      ],
    },
    accuracyData: {
      labels: ['Jan 28', 'Feb 4', 'Feb 8', 'Feb 12', 'Feb 15', 'Feb 18'],
      datasets: [
        {
          label: 'Answer Accuracy (%)',
          data: [62, 65, 70, 75, 78, 82],
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
        },
      ],
    },
    skillsRadarData: {
      labels: ['Technical Knowledge', 'Communication', 'Problem Solving', 'Behavioral', 'Culture Fit', 'Leadership'],
      datasets: [
        {
          label: 'Current Skills',
          data: [82, 85, 78, 88, 75, 80],
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          borderColor: '#3498db',
          borderWidth: 2,
        },
        {
          label: 'Previous Month',
          data: [75, 78, 70, 80, 68, 72],
          backgroundColor: 'rgba(192, 57, 43, 0.2)',
          borderColor: '#c0392b',
          borderWidth: 2,
        },
      ],
    },
    commonMistakes: {
      labels: ['Vague Answers', 'Technical Errors', 'No Examples', 'Speaking Too Fast', 'Filler Words', 'Poor Structure'],
      datasets: [
        {
          data: [30, 25, 20, 15, 8, 2],
          backgroundColor: [
            '#3498db',
            '#e74c3c',
            '#2ecc71',
            '#f39c12',
            '#9b59b6',
            '#1abc9c',
          ],
          borderColor: '#ffffff',
        },
      ],
    },
    improvementAreas: [
      {
        area: 'Provide specific examples',
        description: 'When answering behavioral questions, include concrete examples that demonstrate your skills and achievements.',
        priority: 'High',
      },
      {
        area: 'Technical depth',
        description: 'Dive deeper into technical explanations to showcase your expertise.',
        priority: 'Medium',
      },
      {
        area: 'Response time',
        description: 'Work on reducing your response time while maintaining quality answers.',
        priority: 'Medium',
      },
      {
        area: 'Eliminate filler words',
        description: 'Reduce the use of words like "um", "ah", and "like" in your responses.',
        priority: 'Low',
      },
    ],
    hesitationStats: {
      labels: ['Jan 28', 'Feb 4', 'Feb 8', 'Feb 12', 'Feb 15', 'Feb 18'],
      datasets: [
        {
          label: 'Hesitations Per Minute',
          data: [5.2, 4.8, 4.2, 3.6, 3.2, 2.5],
          backgroundColor: '#9b59b6',
        },
      ],
    },
  });

  const getTrendIcon = (trend) => {
    return trend === 'up' ? '↑' : '↓';
  };

  const getTrendColor = (trend) => {
    return trend === 'up' ? '#2ecc71' : '#e74c3c';
  };

  // Chart configurations
  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Performance Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Hesitations During Speech',
      },
    },
  };

  const radarOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Skills Development',
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Common Mistakes Distribution',
      },
    },
  };

  // Convert history data for line chart
  const historyLabels = progressData.practiceHistory.map(item => item.date);
  const historyScores = progressData.practiceHistory.map(item => item.score);

  const historyChartData = {
    labels: historyLabels,
    datasets: [
      {
        label: 'Overall Score',
        data: historyScores,
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        fill: true,
      },
    ],
  };

  // Render the appropriate content based on active tab
  const renderTabContent = () => {
    switch(activeTab) {
      case 'analytics':
        return (
          <div className="analytics-tab">
            <div className="charts-grid">
              <div className="chart-container">
                <h3>Response Time Trend</h3>
                <Line options={lineOptions} data={progressData.responseTimeData} />
              </div>
              <div className="chart-container">
                <h3>Answer Accuracy Trend</h3>
                <Line options={lineOptions} data={progressData.accuracyData} />
              </div>
              <div className="chart-container">
                <h3>Skills Assessment</h3>
                <Radar options={radarOptions} data={progressData.skillsRadarData} />
              </div>
              <div className="chart-container">
                <h3>Hesitations in Speech Mode</h3>
                <Bar options={barOptions} data={progressData.hesitationStats} />
              </div>
            </div>
          </div>
        );
      
      case 'mistakes':
        return (
          <div className="mistakes-tab">
            <div className="charts-row">
              <div className="chart-container doughnut-container">
                <Doughnut options={doughnutOptions} data={progressData.commonMistakes} />
              </div>
              <div className="mistakes-list">
                <h3>Understanding Your Mistakes</h3>
                <div className="mistake-explanation">
                  <h4>Vague Answers (30%)</h4>
                  <p>Your answers could be more specific and detailed. Use concrete examples from your experience.</p>
                </div>
                <div className="mistake-explanation">
                  <h4>Technical Errors (25%)</h4>
                  <p>Some technical concepts were explained incorrectly or incompletely.</p>
                </div>
                <div className="mistake-explanation">
                  <h4>No Examples (20%)</h4>
                  <p>Strengthen your responses by including relevant examples that showcase your skills.</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'improvement':
        return (
          <div className="improvement-tab">
            <h3>Recommended Improvement Areas</h3>
            <div className="improvement-areas">
              {progressData.improvementAreas.map((area, index) => (
                <div 
                  key={index} 
                  className={`improvement-card priority-${area.priority.toLowerCase()}`}
                >
                  <div className="priority-badge">{area.priority}</div>
                  <h4>{area.area}</h4>
                  <p>{area.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'progress':
      default:
        return (
          <>
            <div className="overall-progress">
              <h2>Your Progress</h2>
              <div className="overall-score">
                <span className="score">{progressData.overallScore}%</span>
                <span 
                  className="trend"
                  style={{ color: getTrendColor(progressData.trend) }}
                >
                  {getTrendIcon(progressData.trend)}
                </span>
              </div>
            </div>

            <div className="metrics-progress">
              <h3>Detailed Metrics</h3>
              <div className="metrics-grid">
                {progressData.metrics.map((metric) => (
                  <div key={metric.name} className="metric-card">
                    <h4>{metric.name}</h4>
                    <div className="metric-score">
                      <span className="current">{metric.current}%</span>
                      <span 
                        className="trend"
                        style={{ color: getTrendColor(metric.trend) }}
                      >
                        {getTrendIcon(metric.trend)} {metric.current - metric.previous}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="practice-history-chart">
              <h3>Performance History</h3>
              <Line options={lineOptions} data={historyChartData} />
            </div>
          </>
        );
    }
  };

  return (
    <div className="progress-tracker">
      <div className="analytics-header">
        <h1>Performance Analytics</h1>
        <p>Track your interview performance and identify areas for improvement</p>
      </div>
      
      <div className="analytics-tabs">
        <button 
          className={activeTab === 'progress' ? 'active' : ''} 
          onClick={() => setActiveTab('progress')}
        >
          Progress Overview
        </button>
        <button 
          className={activeTab === 'analytics' ? 'active' : ''} 
          onClick={() => setActiveTab('analytics')}
        >
          Detailed Analytics
        </button>
        <button 
          className={activeTab === 'mistakes' ? 'active' : ''} 
          onClick={() => setActiveTab('mistakes')}
        >
          Common Mistakes
        </button>
        <button 
          className={activeTab === 'improvement' ? 'active' : ''} 
          onClick={() => setActiveTab('improvement')}
        >
          Improvement Areas
        </button>
      </div>
      
      <div className="tab-content">
        {renderTabContent()}
      </div>
      
      <div className="analytics-footer">
        <button className="generate-report-btn">Generate Detailed Report</button>
        <p>Data based on your last 6 practice sessions</p>
      </div>
    </div>
  );
};

export default ProgressTracker; 