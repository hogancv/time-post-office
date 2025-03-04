import React, { useRef } from 'react';
import styled from 'styled-components';
import { Button } from 'antd';
import Draggable from 'react-draggable';

const WindowContainer = styled.div`
  position: fixed;
  top: ${props => props.defaultPosition?.y || 100}px;
  right: ${props => props.defaultPosition?.x || 100}px;
  width: ${props => props.width || 300}px;
  background: white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  z-index: 1100;
  overflow: hidden;
`;

const WindowHeader = styled.div`
  padding: 10px 15px;
  background: ${props => props.headerColor || '#1890ff'};
  color: white;
  font-weight: bold;
  cursor: move;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const WindowContent = styled.div`
  padding: 15px;
  max-height: ${props => props.maxHeight || 300}px;
  overflow-y: auto;
  line-height: 1.6;
`;

/**
 * 可拖动笔记窗口组件
 * @param {Object} props
 * @param {string} props.title - 窗口标题
 * @param {React.ReactNode} props.content - 窗口内容
 * @param {boolean} props.visible - 窗口是否可见
 * @param {function} props.onClose - 关闭窗口回调
 * @param {Object} props.defaultPosition - 默认位置 {x, y}
 * @param {string} props.headerColor - 标题栏颜色
 * @param {number} props.width - 窗口宽度
 * @param {number} props.maxHeight - 内容区最大高度
 */
const DraggableNoteWindow = ({
  title = "笔记",
  content,
  visible = false,
  onClose,
  defaultPosition = { x: 100, y: 100 },
  headerColor = "#1890ff",
  width = 300,
  maxHeight = 300
}) => {
  const nodeRef = useRef(null);

  if (!visible) return null;

  return (
    <Draggable nodeRef={nodeRef} handle=".window-handle" bounds="body">
      <WindowContainer ref={nodeRef} defaultPosition={defaultPosition} width={width}>
        <WindowHeader className="window-handle" headerColor={headerColor}>
          <span>{title}</span>
          {onClose && (
            <Button 
              type="text" 
              size="small" 
              style={{ color: 'white' }} 
              onClick={onClose}
            >
              ✕
            </Button>
          )}
        </WindowHeader>
        <WindowContent maxHeight={maxHeight}>
          {content}
        </WindowContent>
      </WindowContainer>
    </Draggable>
  );
};

export default DraggableNoteWindow;
