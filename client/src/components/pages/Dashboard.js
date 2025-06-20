import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, Select, Typography } from 'antd';
import { DollarOutlined, FileOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { employeeAPI, salaryAPI } from '../../services/api';

const { Option } = Select;
const { Title } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);

  const [salaryData, setSalaryData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [salaryTrend, setSalaryTrend] = useState([]);

  // 获取统计数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {


        // 获取工资数据
        const salaryRes = await salaryAPI.getAllSalaries({ year: selectedYear });
        setSalaryData(salaryRes.data);



        // 处理工资趋势数据
        const monthlyData = Array(12).fill(0);
        const monthlyCount = Array(12).fill(0);

        salaryRes.data.forEach(salary => {
          const monthIndex = salary.month - 1;
          monthlyData[monthIndex] += salary.total_salary;
          monthlyCount[monthIndex]++;
        });

        // 计算月平均工资
        const avgMonthlyData = monthlyData.map((total, index) => {
          return monthlyCount[index] ? (total / monthlyCount[index]).toFixed(2) : 0;
        });

        setSalaryTrend(avgMonthlyData);
        setLoading(false);
      } catch (error) {
        console.error('获取仪表盘数据失败:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  // 计算平均工资和最近一个月工资
  const avgSalary = salaryData.length ? (salaryData.reduce((sum, item) => sum + item.total_salary, 0) / salaryData.length).toFixed(2) : 0;
  
  // 获取最近一个月的工资数据
  const currentMonth = new Date().getMonth() + 1;
  const recentMonthSalaries = salaryData.filter(salary => salary.month === currentMonth);
  const recentMonthTotal = recentMonthSalaries.reduce((sum, item) => sum + item.total_salary, 0);
  const recentMonthAvg = recentMonthSalaries.length ? (recentMonthTotal / recentMonthSalaries.length).toFixed(2) : 0;



  // 工资趋势图表选项
  const salaryTrendOption = {
    title: {
      text: `${selectedYear}年月平均工资趋势`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    yAxis: {
      type: 'value',
      name: '平均工资 (元)'
    },
    series: [
      {
        name: '平均工资',
        type: 'line',
        data: salaryTrend,
        markPoint: {
          data: [
            { type: 'max', name: '最高值' },
            { type: 'min', name: '最低值' }
          ]
        }
      }
    ]
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>仪表盘</Title>
        <Select 
          defaultValue={selectedYear} 
          style={{ width: 120 }} 
          onChange={value => setSelectedYear(value)}
        >
          {[2021, 2022, 2023, 2024].map(year => (
            <Option key={year} value={year}>{year}年</Option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={16}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="最近一个月平均工资"
                  value={recentMonthAvg}
                  precision={2}
                  prefix={<DollarOutlined />}
                  suffix="元"
                  className="stat-card"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="年度平均工资"
                  value={avgSalary}
                  precision={2}
                  prefix={<DollarOutlined />}
                  suffix="元"
                  className="stat-card"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="最近一个月工资记录数"
                  value={recentMonthSalaries.length}
                  prefix={<FileOutlined />}
                  className="stat-card"
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card className="dashboard-card">
                <ReactECharts option={salaryTrendOption} style={{ height: 400 }} />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;