#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
员工信息Excel数据导入脚本
功能：将Excel员工信息表数据自动导入到SQLite数据库
作者：AI助手
日期：2024
"""

import pandas as pd
import sqlite3
import os
import sys
from datetime import datetime
import argparse
import hashlib

class EmployeeImporter:
    def __init__(self, db_path="server/database/salary.db"):
        """
        初始化员工信息导入器
        
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
    
    def get_existing_employees(self):
        """
        获取现有员工信息，用于检查重复
        
        Returns:
            dict: 员工ID和用户名的映射
        """
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT employee_id, username FROM employees")
            employees = cursor.fetchall()
            
            employee_dict = {
                'employee_ids': set(),
                'usernames': set()
            }
            
            for emp in employees:
                employee_dict['employee_ids'].add(emp[0])
                employee_dict['usernames'].add(emp[1])
            
            print(f"找到 {len(employees)} 个现有员工记录")
            return employee_dict
        except Exception as e:
            print(f"获取员工信息失败：{e}")
            return {'employee_ids': set(), 'usernames': set()}
    
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
    
    def hash_password(self, password):
        """
        对密码进行哈希处理
        
        Args:
            password (str): 原始密码
            
        Returns:
            str: 哈希后的密码
        """
        return hashlib.sha256(password.encode()).hexdigest()
    
    def validate_and_process_data(self, df, existing_employees):
        """
        验证和处理Excel数据
        
        Args:
            df (pandas.DataFrame): Excel数据
            existing_employees (dict): 现有员工信息
            
        Returns:
            list: 处理后的员工记录列表
        """
        processed_records = []
        errors = []
        
        # 定义列名映射（支持中英文列名）
        column_mapping = {
            '员工ID': 'employee_id',
            '员工工号': 'employee_id',
            '工号': 'employee_id',
            'employee_id': 'employee_id',
            '用户名': 'username',
            '登录名': 'username',
            'username': 'username',
            '密码': 'password',
            '登录密码': 'password',
            'password': 'password',
            '姓名': 'name',
            '员工姓名': 'name',
            'name': 'name',
            '部门': 'department',
            '所属部门': 'department',
            'department': 'department',
            '职位': 'position',
            '岗位': 'position',
            'position': 'position',
            '入职日期': 'join_date',
            '入职时间': 'join_date',
            'join_date': 'join_date',
            '角色': 'role',
            '权限': 'role',
            'role': 'role'
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
                
                if employee_id in existing_employees['employee_ids']:
                    errors.append(f"第{row_num}行：员工ID '{employee_id}' 已存在")
                    continue
                
                record['employee_id'] = employee_id
                
                # 验证用户名
                username = str(row.get('username', '')).strip()
                if not username:
                    # 如果没有提供用户名，使用员工ID作为用户名
                    username = employee_id
                
                if username in existing_employees['usernames']:
                    errors.append(f"第{row_num}行：用户名 '{username}' 已存在")
                    continue
                
                record['username'] = username
                
                # 处理密码
                password = str(row.get('password', '')).strip()
                if not password:
                    # 如果没有提供密码，使用默认密码
                    password = '123456'
                
                # 对密码进行哈希处理
                record['password'] = self.hash_password(password)
                
                # 验证姓名
                name = str(row.get('name', '')).strip()
                if not name:
                    errors.append(f"第{row_num}行：员工姓名不能为空")
                    continue
                
                record['name'] = name
                
                # 验证部门
                department = str(row.get('department', '')).strip()
                if not department:
                    errors.append(f"第{row_num}行：部门不能为空")
                    continue
                
                record['department'] = department
                
                # 验证职位
                position = str(row.get('position', '')).strip()
                if not position:
                    errors.append(f"第{row_num}行：职位不能为空")
                    continue
                
                record['position'] = position
                
                # 处理入职日期
                join_date = row.get('join_date')
                if pd.isna(join_date):
                    # 默认为今天
                    record['join_date'] = datetime.now().strftime('%Y-%m-%d')
                else:
                    if isinstance(join_date, datetime):
                        record['join_date'] = join_date.strftime('%Y-%m-%d')
                    else:
                        try:
                            # 尝试解析日期字符串
                            parsed_date = pd.to_datetime(str(join_date))
                            record['join_date'] = parsed_date.strftime('%Y-%m-%d')
                        except:
                            record['join_date'] = str(join_date)
                
                # 处理角色
                role = str(row.get('role', 'employee')).strip().lower()
                if role not in ['admin', 'employee']:
                    role = 'employee'  # 默认为普通员工
                
                record['role'] = role
                
                processed_records.append(record)
                
                # 更新现有员工集合，避免同一批次内的重复
                existing_employees['employee_ids'].add(employee_id)
                existing_employees['usernames'].add(username)
                
            except Exception as e:
                errors.append(f"第{index + 2}行：处理数据时出错 - {str(e)}")
        
        if errors:
            print("\n数据验证错误：")
            for error in errors:
                print(f"  - {error}")
        
        print(f"\n成功处理 {len(processed_records)} 条记录")
        return processed_records, errors
    
    def import_employee_records(self, records):
        """
        导入员工记录到数据库
        
        Args:
            records (list): 员工记录列表
            
        Returns:
            tuple: (成功数量, 失败数量, 错误列表)
        """
        success_count = 0
        error_count = 0
        errors = []
        
        cursor = self.conn.cursor()
        
        for record in records:
            try:
                # 插入新员工记录
                insert_sql = """
                INSERT INTO employees (
                    employee_id, username, password, name, department, position, join_date, role
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """
                cursor.execute(insert_sql, (
                    record['employee_id'], record['username'], record['password'],
                    record['name'], record['department'], record['position'],
                    record['join_date'], record['role']
                ))
                
                print(f"新增员工：{record['employee_id']} - {record['name']} ({record['department']}/{record['position']})")
                success_count += 1
                
            except Exception as e:
                error_count += 1
                error_msg = f"员工 {record['employee_id']} - {record['name']}：{str(e)}"
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
        print("员工信息Excel数据导入工具")
        print("=" * 50)
        
        # 连接数据库
        if not self.connect_database():
            return False
        
        try:
            # 获取现有员工信息
            existing_employees = self.get_existing_employees()
            
            # 读取Excel文件
            df = self.read_excel_file(excel_path)
            if df is None:
                return False
            
            # 验证和处理数据
            records, validation_errors = self.validate_and_process_data(df, existing_employees)
            if not records:
                print("错误：没有有效的数据记录")
                return False
            
            # 导入数据
            success_count, error_count, import_errors = self.import_employee_records(records)
            
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
    parser = argparse.ArgumentParser(description='员工信息Excel数据导入工具')
    parser.add_argument('excel_file', help='Excel文件路径')
    parser.add_argument('--db', default='server/database/salary.db', help='数据库文件路径')
    
    args = parser.parse_args()
    
    # 创建导入器实例
    importer = EmployeeImporter(args.db)
    
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