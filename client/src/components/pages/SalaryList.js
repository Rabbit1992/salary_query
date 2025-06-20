import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message, Input, Typography, Card, Select, Row, Col, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ExclamationCircleOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { salaryAPI, employeeAPI } from '../../services/api';

const { Title } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const SalaryList = () => {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);

  // 获取工资列表和员工列表
  const fetchData = async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = {};
      if (selectedYear) params.year = selectedYear;
      if (selectedMonth) params.month = selectedMonth;
      if (selectedDepartment) params.department = selectedDepartment;

      const salaryRes = await salaryAPI.getAllSalaries(params);
      setSalaries(salaryRes.data);

      const employeeRes = await employeeAPI.getAllEmployees();
      setEmployees(employeeRes.data);

      setLoading(false);
    } catch (error) {
      console.error('获取数据失败:', error);
      message.error('获取数据失败');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth, selectedDepartment]);

  // 删除工资记录
  const handleDelete = (id) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这条工资记录吗？',
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await salaryAPI.deleteSalary(id);
          message.success('工资记录删除成功');
          fetchData();
        } catch (error) {
          console.error('删除工资记录失败:', error);
          message.error('删除工资记录失败');
        }
      },
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '员工ID',
      dataIndex: 'employee_id',
      key: 'employee_id',
      sorter: (a, b) => a.employee_id.localeCompare(b.employee_id),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => {
        const employee = employees.find(emp => emp.employee_id === record.employee_id);
        return <Link to={`/employees/${record.employee_id}`}>{employee ? employee.name : '未知'}</Link>;
      },
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      render: (_, record) => {
        const employee = employees.find(emp => emp.employee_id === record.employee_id);
        return employee ? employee.department : '未知';
      },
      filters: [...new Set(employees.map(emp => emp.department))].map(dept => ({
        text: dept,
        value: dept,
      })),
      onFilter: (value, record) => {
        const employee = employees.find(emp => emp.employee_id === record.employee_id);
        return employee && employee.department === value;
      },
    },
    {
      title: '年份',
      dataIndex: 'year',
      key: 'year',
      sorter: (a, b) => a.year - b.year,
    },
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      sorter: (a, b) => a.month - b.month,
    },
    {
      title: '岗位',
      key: 'position',
      render: (_, record) => {
        const employee = employees.find(emp => emp.employee_id === record.employee_id);
        return employee ? employee.position : '未知';
      },
    },
    {
      title: '工作时间类型',
      dataIndex: 'work_time_type',
      key: 'work_time_type',
    },
    {
      title: '考勤情况',
      dataIndex: 'attendance_status',
      key: 'attendance_status',
    },
    {
      title: '基础工资',
      dataIndex: 'base_salary',
      key: 'base_salary',
      render: (text) => text !== undefined && text !== null ? `¥${text.toFixed(2)}` : '¥0.00',
      sorter: (a, b) => a.base_salary - b.base_salary,
    },
    {
      title: '岗位工资',
      dataIndex: 'position_salary',
      key: 'position_salary',
      render: (text) => text !== undefined && text !== null ? `¥${text.toFixed(2)}` : '¥0.00',
    },
    {
      title: '绩效工资',
      dataIndex: 'performance_salary',
      key: 'performance_salary',
      render: (text) => text !== undefined && text !== null ? `¥${text.toFixed(2)}` : '¥0.00',
    },
    {
      title: '全勤',
      dataIndex: 'full_time',
      key: 'full_time',
      render: (text) => text !== undefined && text !== null ? `¥${text.toFixed(2)}` : '¥0.00',
    },
    {
      title: '其他',
      dataIndex: 'other',
      key: 'other',
      render: (text) => text !== undefined && text !== null ? `¥${text.toFixed(2)}` : '¥0.00',
    },
    {
      title: '加班费',
      dataIndex: 'overtime_pay',
      key: 'overtime_pay',
      render: (text) => text !== undefined && text !== null ? `¥${text.toFixed(2)}` : '¥0.00',
    },
    {
      title: '合计',
      dataIndex: 'total_salary',
      key: 'total_salary',
      render: (text) => text !== undefined && text !== null ? `¥${text.toFixed(2)}` : '¥0.00',
      sorter: (a, b) => a.total_salary - b.total_salary,
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
    },
    {
      title: '发放日期',
      dataIndex: 'payment_date',
      key: 'payment_date',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/salaries/edit/${record.id}`}>
            <Button type="default" size="small" icon={<EditOutlined />}>
              编辑
            </Button>
          </Link>
          <Button 
            type="default" 
            danger 
            size="small" 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 过滤工资数据
  const filteredSalaries = salaries.filter(salary => {
    const employee = employees.find(emp => emp.employee_id === salary.employee_id);
    const employeeName = employee ? employee.name : '';
    const department = employee ? employee.department : '';
    
    return (
      salary.employee_id.toLowerCase().includes(searchText.toLowerCase()) ||
      employeeName.toLowerCase().includes(searchText.toLowerCase()) ||
      department.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  // 生成年份选项
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 3; i <= currentYear + 1; i++) {
    yearOptions.push(i);
  }

  // 生成月份选项
  const monthOptions = [];
  for (let i = 1; i <= 12; i++) {
    monthOptions.push(i);
  }

  // 获取部门选项
  const departmentOptions = [...new Set(employees.map(emp => emp.department))];

  // 处理 Excel 导入
  const handleImport = async (options) => {
    const { file, onSuccess, onError } = options;
    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await salaryAPI.importSalaryExcel(formData);
      message.success(`${response.data.success} 条工资记录导入成功`);
      if (response.data.errors && response.data.errors.length > 0) {
        Modal.warning({
          title: '部分数据导入失败',
          content: (
            <div>
              <p>以下行数据导入失败：</p>
              <ul>
                {response.data.errors.map((error, index) => (
                  <li key={index}>{`行 ${error.row}: ${error.message}`}</li>
                ))}
              </ul>
            </div>
          ),
        });
      }
      fetchData(); // 刷新数据
      onSuccess && onSuccess(response.data);
    } catch (error) {
      console.error('导入失败:', error);
      message.error('导入失败: ' + (error.response?.data?.message || error.message));
      onError && onError(error);
    } finally {
      setImportLoading(false);
      setImportModalVisible(false);
    }
  };

  // 上传前检查文件类型
  const beforeUpload = (file) => {
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                    file.type === 'application/vnd.ms-excel';
    if (!isExcel) {
      message.error('只能上传 Excel 文件!');
      return Upload.LIST_IGNORE;
    }
    return false; // 阻止自动上传
  };

  // 显示导入模态框
  const showImportModal = () => {
    setImportModalVisible(true);
  };

  // 关闭导入模态框
  const handleImportCancel = () => {
    setImportModalVisible(false);
  };

  // 下载Excel模板
  const handleDownloadTemplate = async () => {
    try {
      const response = await salaryAPI.downloadTemplate();
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'salary_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success('模板下载成功');
    } catch (error) {
      console.error('下载模板失败:', error);
      message.error('下载模板失败');
    }
  };

  return (
    <div>
      <Card>
        <div className="table-actions">
          <Title level={2}>工资管理</Title>
          <Space>
            <Input
              placeholder="搜索员工ID或姓名"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Link to="/salaries/add">
              <Button type="primary" icon={<PlusOutlined />}>
                添加工资记录
              </Button>
            </Link>
            <Button 
              type="primary" 
              icon={<UploadOutlined />} 
              onClick={showImportModal}
            >
              导入 Excel
            </Button>
          </Space>
        </div>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择年份"
              value={selectedYear}
              onChange={value => setSelectedYear(value)}
              allowClear
            >
              {yearOptions.map(year => (
                <Option key={year} value={year}>{year}年</Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择月份"
              value={selectedMonth}
              onChange={value => setSelectedMonth(value)}
              allowClear
            >
              {monthOptions.map(month => (
                <Option key={month} value={month}>{month}月</Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择部门"
              value={selectedDepartment}
              onChange={value => setSelectedDepartment(value)}
              allowClear
            >
              {departmentOptions.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredSalaries}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1300 }}
        />
      </Card>

      {/* Excel 导入模态框 */}
      <Modal
        title="导入工资数据"
        visible={importModalVisible}
        onCancel={handleImportCancel}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleDownloadTemplate}
            style={{ width: '100%', marginBottom: 8 }}
          >
            下载Excel模板
          </Button>
          <Upload
            name="file"
            accept=".xlsx,.xls"
            beforeUpload={beforeUpload}
            customRequest={handleImport}
            showUploadList={false}
          >
            <Button 
              icon={<UploadOutlined />} 
              loading={importLoading}
              type="primary" 
              style={{ width: '100%', marginBottom: 16 }}
            >
              选择 Excel 文件
            </Button>
          </Upload>
        </Space>
        <div style={{ marginTop: 16 }}>
          <p><strong>注意事项：</strong></p>
          <ul>
            <li>请使用标准模板导入数据</li>
            <li>Excel 文件第一行必须是表头</li>
            <li>必须包含：姓名、岗位、工作时间类型、考勤情况、基础工资、岗位工资、绩效工资、全勤、其他、加班情况（平日累计时间、双休日累计时间、法定节日累计时间）、加班费、合计、备注</li>
            <li>员工姓名必须与系统中已有员工匹配</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
};

export default SalaryList;