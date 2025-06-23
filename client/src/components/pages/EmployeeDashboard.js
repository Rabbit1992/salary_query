import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, Select, Typography } from 'antd';
import { DollarOutlined, RiseOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { salaryAPI } from '../../services/api';

const { Option } = Select;
const { Title } = Typography;

const EmployeeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [salaryData, setSalaryData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [salaryTrend, setSalaryTrend] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 从本地存储获取用户信息
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 获取个人工资数据
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.employee_id) return;
      
      setLoading(true);
      try {
        // 获取个人工资数据
        const salaryRes = await salaryAPI.getEmployeeSalaries(user.employee_id, { year: selectedYear });
        setSalaryData(salaryRes.data);

        // 处理工资趋势数据
        const monthlyData = Array(12).fill(0);
        const monthlyCount = Array(12).fill(0);

        salaryRes.data.forEach(salary => {
          const monthIndex = salary.month - 1;
          monthlyData[monthIndex] = salary.total_salary;
          monthlyCount[monthIndex] = 1;
        });

        setSalaryTrend(monthlyData);
        setLoading(false);
      } catch (error) {
        console.error('获取个人工资数据失败:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, user]);

  // 计算统计数据
  const totalSalary = salaryData.reduce((sum, item) => sum + item.total_salary, 0);
  const avgSalary = salaryData.length ? (totalSalary / salaryData.length).toFixed(2) : 0;
  const maxSalary = salaryData.length ? Math.max(...salaryData.map(item => item.total_salary)).toFixed(2) : 0;
  
  // 获取最近一个月的工资数据
  const currentMonth = new Date().getMonth() + 1;
  const recentMonthSalary = salaryData.find(salary => salary.month === currentMonth);
  const recentMonthAmount = recentMonthSalary ? recentMonthSalary.total_salary.toFixed(2) : 0;

  // 工资趋势图表选项
  const salaryTrendOption = {
    title: {
      text: `${selectedYear}年个人工资趋势`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const value = params[0].value;
        return `${params[0].name}<br/>工资: ¥${value}`;
      }
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    yAxis: {
      type: 'value',
      name: '工资 (元)'
    },
    series: [
      {
        name: '月工资',
        type: 'line',
        data: salaryTrend,
        markPoint: {
          data: [
            { type: 'max', name: '最高值' },
            { type: 'min', name: '最低值' }
          ]
        },
        markLine: {
          data: [
            { type: 'average', name: '平均值' }
          ]
        }
      }
    ]
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>我的收入概览</Title>
        <Select 
          defaultValue={selectedYear} 
          style={{ width: 120 }} 
          onChange={value => setSelectedYear(value)}
        >
          {[2021, 2022, 2023, 2024, 2025].map(year => (
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
            <Col span={6}>
              <Card>
                <Statistic
                  title="年度总收入"
                  value={totalSalary}
                  precision={2}
                  prefix={<DollarOutlined />}
                  suffix="元"
                  className="stat-card"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="月平均收入"
                  value={avgSalary}
                  precision={2}
                  prefix={<DollarOutlined />}
                  suffix="元"
                  className="stat-card"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="最高月收入"
                  value={maxSalary}
                  precision={2}
                  prefix={<RiseOutlined />}
                  suffix="元"
                  className="stat-card"
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="本月收入"
                  value={recentMonthAmount}
                  precision={2}
                  prefix={<DollarOutlined />}
                  suffix="元"
                  className="stat-card"
                  valueStyle={{ color: '#722ed1' }}
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

          {user && (
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Card title="个人信息">
                  <Row gutter={16}>
                    <Col span={6}>
                      <p><strong>姓名:</strong> {user.name || user.employee_name || user.username}</p>
                    </Col>
                    <Col span={6}>
                      <p><strong>工号:</strong> {user.employee_id}</p>
                    </Col>
                    <Col span={6}>
                      <p><strong>部门:</strong> {user.department}</p>
                    </Col>
                    <Col span={6}>
                      <p><strong>职位:</strong> {user.position}</p>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeDashboard;