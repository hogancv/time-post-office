import React from 'react';
import styled from 'styled-components';

const MenuContainer = styled.div`
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 140px;
  z-index: 1000;
  
  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(rgba(0, 0, 0, 0.1), transparent);
  }
`;

const MenuItem = styled.div`
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
    color: #1890ff;
  }

  svg {
    font-size: 16px;
  }
`;

const ContextMenu = ({ x, y, onClose, onNoteClick, onPropertiesClick }) => {
  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} onClick={onClose} />
      <MenuContainer style={{ left: x, top: y }}>
        <MenuItem onClick={onNoteClick}>
          <i className="fas fa-sticky-note" />
          笔记
        </MenuItem>
        <MenuItem onClick={onPropertiesClick}>
          <i className="fas fa-cog" />
          属性
        </MenuItem>
      </MenuContainer>
    </>
  );
};

export default ContextMenu; 