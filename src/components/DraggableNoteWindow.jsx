import { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import { Button, message } from "antd";
import Draggable from "react-draggable";

const WindowContainer = styled.div`
  position: fixed;
  top: ${(props) => props.defaultPosition?.y || 100}px;
  right: ${(props) => props.defaultPosition?.x || 100}px;
  width: ${(props) => props.width || 300}px;
  background: white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  z-index: 1100;
  overflow: hidden;
`;

const WindowHeader = styled.div`
  padding: 10px 15px;
  background: ${(props) => props.headerColor || "#1890ff"};
  color: white;
  font-weight: bold;
  cursor: move;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const WindowContent = styled.div`
  padding: 15px;
  max-height: ${(props) => props.maxHeight || 300}px;
  overflow-y: auto;
  line-height: 1.6;
`;

const NoteTextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
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
 * @param {function} props.onSave - 保存笔记回调
 * @param {boolean} props.editable - 是否可编辑
 * @param {boolean} props.resetEditing - 是否重置编辑状态
 */
const DraggableNoteWindow = ({
  title = "笔记",
  content,
  visible = false,
  onClose,
  defaultPosition = { x: 100, y: 100 },
  headerColor = "#1890ff",
  width = 300,
  maxHeight = 300,
  onSave,
  editable = false,
  resetEditing = false,
}) => {
  const nodeRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  // 当content变化时，更新editedContent
  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  useEffect(() => {
    if (resetEditing && isEditing) {
      setIsEditing(false);
    }
  }, [resetEditing, isEditing]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(content); // 恢复原内容
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editedContent);
      message.success("笔记已保存！");
    }
    setIsEditing(false);
  };

  if (!visible) return null;

  return (
    <Draggable nodeRef={nodeRef} handle=".window-handle" bounds="body">
      <WindowContainer
        ref={nodeRef}
        defaultPosition={defaultPosition}
        width={width}
      >
        <WindowHeader className="window-handle" headerColor={headerColor}>
          <span>{title}</span>
          <div>
            {!isEditing && editable && (
              <Button
                type="text"
                size="small"
                style={{ color: "white", marginRight: 8 }}
                onClick={handleEditClick}
              >
                编辑
              </Button>
            )}
            {onClose && (
              <Button
                type="text"
                size="small"
                style={{ color: "white" }}
                onClick={onClose}
              >
                ✕
              </Button>
            )}
          </div>
        </WindowHeader>
        <WindowContent maxHeight={maxHeight}>
          {isEditing ? (
            <>
              <NoteTextArea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="编辑笔记内容..."
              />
              <ButtonGroup>
                <Button onClick={handleCancelEdit}>取消</Button>
                <Button type="primary" onClick={handleSave}>
                  保存
                </Button>
              </ButtonGroup>
            </>
          ) : (
            content
          )}
        </WindowContent>
      </WindowContainer>
    </Draggable>
  );
};

export default DraggableNoteWindow;
