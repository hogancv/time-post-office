import React from 'react';
import styled from 'styled-components';
import { HomeOutlined, AppstoreOutlined, FileTextOutlined } from '@ant-design/icons';

const SidebarContainer = styled.div`
  width: 200px;
  height: 100vh;
  background-color: #001529;
  position: fixed;
  left: 0;
  top: 0;
  padding-top: 20px;
`;

const MenuItem = styled.div`
  padding: 16px 24px;
  color: ${props => props.$active ? '#1890ff' : 'rgba(255, 255, 255, 0.65)'};
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    color: #1890ff;
    background: rgba(255, 255, 255, 0.08);
  }

  ${props => props.$active && `
    background: rgba(24, 144, 255, 0.1);
    color: #1890ff;
  `}
`;

const Sidebar = ({ activePage, activeFilter, onFilterChange, onPageChange }) => {
  return (
    <SidebarContainer>
      <MenuItem 
        $active={activePage === 'home' && !activeFilter}
        onClick={() => {
          onPageChange('home');
          onFilterChange(''); // 清除筛选条件
        }}
      >
        <HomeOutlined />
        <span>首页</span>
      </MenuItem>
      <MenuItem 
        $active={activePage === 'categories'}
        onClick={() => onPageChange('categories')}
      >
        <AppstoreOutlined />
        <span>类别</span>
      </MenuItem>
      <MenuItem 
        $active={activeFilter === 'hasNotes'}
        onClick={() => onFilterChange('hasNotes')}
      >
        <FileTextOutlined />
        <span>笔记</span>
      </MenuItem>
    </SidebarContainer>
  );
};

export default Sidebar; 