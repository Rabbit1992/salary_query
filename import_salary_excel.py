#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
工资Excel数据导入脚本
功能：将Excel工资表数据自动导入到SQLite数据库
作者：AI助手
日期：2024
"""

import pandas as pd
import sqlite3
import os
import sys
from datetime import datetime
import argparse

class SalaryImporter:
    def __init__(self, db_path="server/database/salary.db"):
        """
        初始化工资导入器
        
        Args:
            db_path (str): SQLite数据库文件路径
        """
        self.db_path = db_path
        self.conn = None
        
    def connect_database(self):
        """
        连接到SQLite数据库
        """
        try:
            if not os.path.exists(self.db_path):
                print(f"错误：数据库文件不存在 - {self.db_path}")
                return False
                
            self.conn = sqlite3.connect(self.db_path)
            print(f"成功连接到数据库：{self.db_path}")
            return True
        except Exception as e:
            print(f"数据库连接失败：{e}")
            return False
    
    def get_employees(self):
        """
        获取所有员工信息，用于验证员工ID
        
        Returns:
            dict: 员工ID到员工信息的映射
        """
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT employee_id, name, department, position FROM employees")
            employees = cursor.fetchall()
            
            employee_dict = {}
            for emp in employees:
                employee_dict[emp[0]] = {
                    'name': emp[1],
                    'department': emp[2],
                    'position': emp[3]
                }
            
            print(f"找到 {len(employee_dict)} 个员工记录")
            return employee_dict
        except Exception as e:
            print(f"获取员工信息失败：{e}")
            return {}
    
    def read_excel_file(self, excel_path):
        """
        读取Excel文件
        
        Args:
            excel_path (str): Excel文件路径
            
        Returns:
            pandas.DataFrame: Excel数据
        """
        try:
            if not os.path.exists(excel_path):
                print(f"错误：Excel文件不存在 - {excel_path}")
                return None
            
            # 尝试读取Excel文件
            df = pd.read_excel(excel_path)
            print(f"成功读取Excel文件：{excel_path}")
            print(f"数据行数：{len(df)}")
            print(f"列名：{list(df.columns)}")
            
            return df
        except Exception as e:
            print(f"读取Excel文件失败：{e}")
            return None
    
    def validate_and_process_data(self, df, employees):
        """
        验证和处理Excel数据
        
        Args:
            df (pandas.DataFrame): Excel数据
            employees (dict): 员工信息字典
            
        Returns:
            list: 处理后的工资记录列表
        """
        processed_records = []
        errors = []
        
        # 定义列名映射（支持中英文列名）
        column_mapping = {
            '员工ID': 'employee_id',
            '员工工号': 'employee_id', 
            'employee_id': 'employee_id',
            '年份': 'year',
            'year': 'year',
            '月份': 'month',
            'month': 'month',
            '年月': 'year_month',
            '基础工资': 'base_salary',
            '基本工资': 'base_salary',
            'base_salary': 'base_salary',
            '岗位工资': 'position_salary',
            '职位工资': 'position_salary',
            'position_salary': 'position_salary',
            '绩效工资': 'performance_salary',
            'performance_salary': 'performance_salary',
            '全勤': 'full_time',
            '全勤奖': 'full_time',
            'full_time': 'full_time',
            '其他': 'other',
            '其他津贴': 'other',
            'other': 'other',
            '加班费': 'overtime_pay',
            'overtime_pay': 'overtime_pay',
            '奖金': 'bonus',
            'bonus': 'bonus',
            '津贴': 'allowance',
            'allowance': 'allowance',
            '扣除': 'deduction',
            '扣款': 'deduction',
            'deduction': 'deduction',
            '合计': 'total_salary',
            '总工资': 'total_salary',
            'total_salary': 'total_salary',
            '发放日期': 'payment_date',
            'payment_date': 'payment_date',
            '备注': 'remarks',
            'remarks': 'remarks'
        }
        
        # 重命名列
        df_renamed = df.rename(columns=column_mapping)
        
        for index, row in df_renamed.iterrows():
            try:
                record = {}
                row_num = index + 2  # Excel行号从2开始（1是表头）
                
                # 验证员工ID
                employee_id = str(row.get('employee_id', '')).strip()
                if not employee_id:
                    errors.append(f"第{row_num}行：员工ID不能为空")
                    continue
                
                if employee_id not in employees:
                    errors.append(f"第{row_num}行：员工ID '{employee_id}' 不存在于系统中")
                    continue
                
                record['employee_id'] = employee_id
                
                # 处理年月信息
                if 'year_month' in df_renamed.columns and pd.notna(row.get('year_month')):
                    year_month_str = str(row['year_month']).strip()
                    # 尝试解析年月格式：2023年5月、2023-05、202305等
                    import re
                    match = re.search(r'(\d{4}).*?(\d{1,2})', year_month_str)
                    if match:
                        record['year'] = int(match.group(1))
                        record['month'] = int(match.group(2))
                    else:
                        errors.append(f"第{row_num}行：年月格式不正确 '{year_month_str}'")
                        continue
                else:
                    # 分别获取年份和月份
                    year = row.get('year')
                    month = row.get('month')
                    
                    if pd.isna(year) or pd.isna(month):
                        # 使用当前年月作为默认值
                        current_date = datetime.now()
                        record['year'] = int(year) if pd.notna(year) else current_date.year
                        record['month'] = int(month) if pd.notna(month) else current_date.month
                    else:
                        record['year'] = int(year)
                        record['month'] = int(month)
                
                # 验证年月范围
                if record['month'] < 1 or record['month'] > 12:
                    errors.append(f"第{row_num}行：月份必须在1-12之间")
                    continue
                
                # 处理工资字段（转换为浮点数，默认值为0）
                salary_fields = [
                    'base_salary', 'position_salary', 'performance_salary',
                    'overtime_pay', 'bonus', 'allowance', 'deduction', 'full_time', 'other'
                ]
                
                for field in salary_fields:
                    value = row.get(field, 0)
                    if pd.isna(value):
                        record[field] = 0.0
                    else:
                        try:
                            record[field] = float(value)
                        except (ValueError, TypeError):
                            record[field] = 0.0
                
                # 验证基础工资不能为空或0
                if record['base_salary'] <= 0:
                    errors.append(f"第{row_num}行：基础工资必须大于0")
                    continue
                
                # 计算总工资
                if 'total_salary' in df_renamed.columns and pd.notna(row.get('total_salary')):
                    record['total_salary'] = float(row['total_salary'])
                else:
                    # 自动计算总工资
                    record['total_salary'] = (
                        record['base_salary'] + record['position_salary'] + 
                        record['performance_salary'] + record['overtime_pay'] + 
                        record['bonus'] + record['allowance'] + record['full_time'] + 
                        record['other'] - record['deduction']
                    )
                
                # 处理发放日期
                payment_date = row.get('payment_date')
                if pd.isna(payment_date):
                    # 默认为当月10号
                    record['payment_date'] = f"{record['year']}-{record['month']:02d}-10"
                else:
                    if isinstance(payment_date, datetime):
                        record['payment_date'] = payment_date.strftime('%Y-%m-%d')
                    else:
                        record['payment_date'] = str(payment_date)
                
                # 处理备注
                record['remarks'] = str(row.get('remarks', '')).strip()
                
                # 注意：只使用数据库中实际存在的字段
                
                processed_records.append(record)
                
            except Exception as e:
                errors.append(f"第{index + 2}行：处理数据时出错 - {str(e)}")
        
        if errors:
            print("\n数据验证错误：")
            for error in errors:
                print(f"  - {error}")
        
        print(f"\n成功处理 {len(processed_records)} 条记录")
        return processed_records, errors
    
    def import_salary_records(self, records):
        """
        导入工资记录到数据库
        
        Args:
            records (list): 工资记录列表
            
        Returns:
            tuple: (成功数量, 失败数量, 错误列表)
        """
        success_count = 0
        error_count = 0
        errors = []
        
        cursor = self.conn.cursor()
        
        for record in records:
            try:
                # 检查是否已存在该员工该月的工资记录
                cursor.execute(
                    "SELECT id FROM salaries WHERE employee_id = ? AND year = ? AND month = ?",
                    (record['employee_id'], record['year'], record['month'])
                )
                existing = cursor.fetchone()
                
                if existing:
                    # 更新现有记录
                    update_sql = """
                    UPDATE salaries SET 
                        base_salary = ?, position_salary = ?, performance_salary = ?,
                        overtime_pay = ?, bonus = ?, allowance = ?, deduction = ?, 
                        full_time = ?, other = ?, total_salary = ?, payment_date = ?
                    WHERE id = ?
                    """
                    cursor.execute(update_sql, (
                        record['base_salary'], record['position_salary'], record['performance_salary'],
                        record['overtime_pay'], record['bonus'], record['allowance'], record['deduction'],
                        record['full_time'], record['other'], record['total_salary'], record['payment_date'], existing[0]
                    ))
                    print(f"更新员工 {record['employee_id']} {record['year']}年{record['month']}月工资记录")
                else:
                    # 插入新记录
                    insert_sql = """
                    INSERT INTO salaries (
                        employee_id, year, month, base_salary, position_salary, performance_salary,
                        overtime_pay, bonus, allowance, deduction, full_time, other, total_salary, payment_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """
                    cursor.execute(insert_sql, (
                        record['employee_id'], record['year'], record['month'],
                        record['base_salary'], record['position_salary'], record['performance_salary'],
                        record['overtime_pay'], record['bonus'], record['allowance'], record['deduction'],
                        record['full_time'], record['other'], record['total_salary'], record['payment_date']
                    ))
                    print(f"新增员工 {record['employee_id']} {record['year']}年{record['month']}月工资记录")
                
                success_count += 1
                
            except Exception as e:
                error_count += 1
                error_msg = f"员工 {record['employee_id']} {record['year']}年{record['month']}月：{str(e)}"
                errors.append(error_msg)
                print(f"错误：{error_msg}")
        
        # 提交事务
        self.conn.commit()
        
        return success_count, error_count, errors
    
    def close_connection(self):
        """
        关闭数据库连接
        """
        if self.conn:
            self.conn.close()
            print("数据库连接已关闭")
    
    def import_excel(self, excel_path):
        """
        主要导入流程
        
        Args:
            excel_path (str): Excel文件路径
            
        Returns:
            bool: 导入是否成功
        """
        print("=" * 50)
        print("工资Excel数据导入工具")
        print("=" * 50)
        
        # 连接数据库
        if not self.connect_database():
            return False
        
        try:
            # 获取员工信息
            employees = self.get_employees()
            if not employees:
                print("错误：无法获取员工信息")
                return False
            
            # 读取Excel文件
            df = self.read_excel_file(excel_path)
            if df is None:
                return False
            
            # 验证和处理数据
            records, validation_errors = self.validate_and_process_data(df, employees)
            if not records:
                print("错误：没有有效的数据记录")
                return False
            
            # 导入数据
            success_count, error_count, import_errors = self.import_salary_records(records)
            
            # 输出结果
            print("\n" + "=" * 50)
            print("导入结果统计")
            print("=" * 50)
            print(f"成功导入：{success_count} 条记录")
            print(f"导入失败：{error_count} 条记录")
            
            if import_errors:
                print("\n导入错误详情：")
                for error in import_errors:
                    print(f"  - {error}")
            
            return error_count == 0
            
        finally:
            self.close_connection()

def main():
    """
    主函数
    """
    parser = argparse.ArgumentParser(description='工资Excel数据导入工具')
    parser.add_argument('excel_file', help='Excel文件路径')
    parser.add_argument('--db', default='server/database/salary.db', help='数据库文件路径')
    
    args = parser.parse_args()
    
    # 创建导入器实例
    importer = SalaryImporter(args.db)
    
    # 执行导入
    success = importer.import_excel(args.excel_file)
    
    if success:
        print("\n✅ 导入完成！")
        sys.exit(0)
    else:
        print("\n❌ 导入失败！")
        sys.exit(1)

if __name__ == '__main__':
    main()