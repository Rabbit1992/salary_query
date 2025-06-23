import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, DatePicker, Select, Typography, Space, InputNumber, Divider } from 'antd';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { SaveOutlined, ArrowLeftOutlined, CalculatorOutlined } from '@ant-design/icons';
import moment from 'moment';
import { salaryAPI, employeeAPI } from '../../services/api';

const { Option } = Select;
const { Title } = Typography;

const SalaryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [initialValues, setInitialValues] = useState(null);
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  
  const isEditMode = !!id;

  // 从URL查询参数中获取预选员工ID
  const queryParams = new URLSearchParams(location.search);
  const preSelectedEmployeeId = queryParams.get('employee_id');

  // 获取员工列表
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await employeeAPI.getAllEmployees();
        setEmployees(response.data);
      } catch (error) {
        console.error('获取员工列表失败:', error);
        message.error('获取员工列表失败');
      }
    };
    
    fetchEmployees();
  }, []);

  // 如果是编辑模式，获取工资记录详情
  useEffect(() => {
    if (isEditMode) {
      const fetchSalary = async () => {
        try {
          const response = await salaryAPI.getAllSalaries();
          const salary = response.data.find(s => s.id === parseInt(id));
          
          if (salary) {
            setInitialValues({
              ...salary,
              payment_date: moment(salary.payment_date)
            });
            
            form.setFieldsValue({
              ...salary,
              payment_date: moment(salary.payment_date)
            });
            
            setCalculatedTotal(salary.total_salary);
          } else {
            message.error('未找到工资记录');
            navigate('/salaries');
          }
        } catch (error) {
          console.error('获取工资记录失败:', error);
          message.error('获取工资记录失败');
        }
      };
      
      fetchSalary();
    } else if (preSelectedEmployeeId) {
      // 如果有预选员工ID，设置表单值
      form.setFieldsValue({
        employee_id: preSelectedEmployeeId,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        payment_date: moment()
      });
    }
  }, [id, form, isEditMode, navigate, preSelectedEmployeeId]);

  // 计算总工资
  const calculateTotal = () => {
    const values = form.getFieldsValue();
    const baseSalary = parseFloat(values.base_salary) || 0;
    const positionSalary = parseFloat(values.position_salary) || 0;
    const performanceSalary = parseFloat(values.performance_salary) || 0;
    const fullTime = parseFloat(values.full_time) || 0;
    const other = parseFloat(values.other) || 0;
    const overtimePay = parseFloat(values.overtime_pay) || 0;
    const bonus = parseFloat(values.bonus) || 0;
    const allowance = parseFloat(values.allowance) || 0;
    const deduction = parseFloat(values.deduction) || 0;
    
    const total = baseSalary + positionSalary + performanceSalary + fullTime + other + overtimePay + bonus + allowance - deduction;
    setCalculatedTotal(total);
    return total;
  };

  // 表单提交
  const onFinish = async (values) => {
    // 计算总工资
    const total_salary = calculateTotal();
    
    // 格式化日期
    const formattedValues = {
      ...values,
      payment_date: values.payment_date.format('YYYY-MM-DD'),
      total_salary
    };
    
    setLoading(true);
    
    try {
      if (isEditMode) {
        // 更新工资记录
        await salaryAPI.updateSalary(id, formattedValues);
        message.success('工资记录更新成功');
      } else {
        // 添加工资记录
        await salaryAPI.addSalary(formattedValues);
        message.success('工资记录添加成功');
        form.resetFields();
      }
      
      // 返回工资列表
      navigate('/salaries');
    } catch (error) {
      console.error('保存工资记录失败:', error);
      message.error('保存工资记录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Link to="/salaries">
            <Button icon={<ArrowLeftOutlined />}>返回工资列表</Button>
          </Link>
        </Space>
      </div>
      
      <Card className="form-container">
        <Title level={2}>{isEditMode ? '编辑工资记录' : '添加工资记录'}</Title>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={initialValues || {
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            base_salary: 0,
            position_salary: 0,
            performance_salary: 0,
            work_time_type: '',
            attendance_status: '',
            full_time: 0,
            other: 0,
            weekday_overtime_hours: 0,
            weekend_overtime_hours: 0,
            holiday_overtime_hours: 0,
            overtime_pay: 0,
            bonus: 0,
            allowance: 0,
            deduction: 0,
            payment_date: moment(),
            remarks: ''
          }}
          onValuesChange={() => calculateTotal()}
        >
          <Form.Item
            name="employee_id"
            label="员工"
            rules={[{ required: true, message: '请选择员工' }]}
          >
            <Select 
              placeholder="请选择员工"
              disabled={isEditMode} // 编辑模式下不允许修改员工
              showSearch
              optionFilterProp="children"
            >
              {employees.map(emp => (
                <Option key={emp.employee_id} value={emp.employee_id}>
                  {emp.name} ({emp.employee_id}) - {emp.department}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="year"
            label="年份"
            rules={[{ required: true, message: '请选择年份' }]}
          >
            <Select placeholder="请选择年份">
              {[2021, 2022, 2023, 2024, 2025].map(year => (
                <Option key={year} value={year}>{year}年</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="month"
            label="月份"
            rules={[{ required: true, message: '请选择月份' }]}
          >
            <Select placeholder="请选择月份">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <Option key={month} value={month}>{month}月</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="work_time_type"
            label="工作时间类型"
          >
            <Input placeholder="请输入工作时间类型" />
          </Form.Item>

          <Form.Item
            name="attendance_status"
            label="考勤情况"
          >
            <Input placeholder="请输入考勤情况" />
          </Form.Item>

          <Form.Item
            name="base_salary"
            label="基础工资"
            rules={[{ required: true, message: '请输入基础工资' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={100}
              precision={2}
              prefix="¥"
              placeholder="请输入基础工资"
            />
          </Form.Item>
          
          <Form.Item
            name="position_salary"
            label="岗位工资"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={100}
              precision={2}
              prefix="¥"
              placeholder="请输入岗位工资"
            />
          </Form.Item>
          
          <Form.Item
            name="performance_salary"
            label="绩效工资"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={100}
              precision={2}
              prefix="¥"
              placeholder="请输入绩效工资"
            />
          </Form.Item>
          
          <Form.Item
            name="full_time"
            label="全勤"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={100}
              precision={2}
              prefix="¥"
              placeholder="请输入全勤奖金"
            />
          </Form.Item>
          
          <Form.Item
            name="other"
            label="其他"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={100}
              precision={2}
              prefix="¥"
              placeholder="请输入其他补贴"
            />
          </Form.Item>
          
          <div style={{ marginBottom: 16 }}>
            <Typography.Title level={5}>加班情况</Typography.Title>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                name="weekday_overtime_hours"
                label="平日累计时间"
                style={{ flex: 1 }}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.5}
                  precision={1}
                  placeholder="小时"
                />
              </Form.Item>
              
              <Form.Item
                name="weekend_overtime_hours"
                label="双休日累计时间"
                style={{ flex: 1 }}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.5}
                  precision={1}
                  placeholder="小时"
                />
              </Form.Item>
              
              <Form.Item
                name="holiday_overtime_hours"
                label="法定节日累计时间"
                style={{ flex: 1 }}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.5}
                  precision={1}
                  placeholder="小时"
                />
              </Form.Item>
            </div>
          </div>
          
          <Form.Item
            name="overtime_pay"
            label="加班费"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={100}
              precision={2}
              prefix="¥"
              placeholder="请输入加班费"
            />
          </Form.Item>
          
          <Form.Item
            name="bonus"
            label="奖金"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={100}
              precision={2}
              prefix="¥"
              placeholder="请输入奖金"
            />
          </Form.Item>
          
          <Form.Item
            name="allowance"
            label="津贴"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={100}
              precision={2}
              prefix="¥"
              placeholder="请输入津贴"
            />
          </Form.Item>
          
          <Form.Item
            name="deduction"
            label="扣除"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={100}
              precision={2}
              prefix="¥"
              placeholder="请输入扣除金额"
            />
          </Form.Item>
          
          <Form.Item label="总工资">
            <InputNumber
              style={{ width: '100%' }}
              value={calculatedTotal}
              precision={2}
              prefix="¥"
              disabled
            />
            <Button 
              type="link" 
              icon={<CalculatorOutlined />}
              onClick={calculateTotal}
            >
              重新计算
            </Button>
          </Form.Item>
          
          <Form.Item
            name="payment_date"
            label="发放日期"
            rules={[{ required: true, message: '请选择发放日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="remarks"
            label="备注"
          >
            <Input.TextArea rows={4} placeholder="请输入备注信息" />
          </Form.Item>
          
          <Form.Item className="form-actions">
            <Button type="default" onClick={() => navigate('/salaries')}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SalaryForm;