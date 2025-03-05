import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { Button, message, DatePicker } from 'antd';
import Draggable from 'react-draggable';
import dayjs from 'dayjs';

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

const InputField = styled.input`
  box-sizing: border-box;
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 10px;

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
 * 可拖动图片属性窗口组件
 * @param {Object} props
 * @param {string} props.title - 窗口标题
 * @param {Object} props.image - 图片属性对象
 * @param {boolean} props.visible - 窗口是否可见
 * @param {function} props.onClose - 关闭窗口回调
 * @param {Object} props.defaultPosition - 默认位置 {x, y}
 * @param {string} props.headerColor - 标题栏颜色
 * @param {number} props.width - 窗口宽度
 * @param {number} props.maxHeight - 内容区最大高度
 * @param {function} props.onSave - 保存属性回调
 */
const ImagePropertiesDialog = ({
  title = "图片属性",
  image = {},
  visible = false,
  onClose,
  defaultPosition = { x: 100, y: 100 },
  headerColor = "#1890ff",
  width = 300,
  maxHeight = 500,
  onSave,
}) => {
  const nodeRef = useRef(null);
  const [formData, setFormData] = useState({
    make: image.make || '',
    model: image.model || '',
    software: image.software || '',
    artist: image.artist || '',
    dateCreated: image.dateCreated ? dayjs(image.dateCreated) : null,
  });
  const [isEditing, setIsEditing] = useState(false);

  // 监听 image 的变化
  React.useEffect(() => {
    setFormData({
      make: image.make || '',
      model: image.model || '',
      software: image.software || '',
      artist: image.artist || '',
      dateCreated: image.dateCreated ? dayjs(image.dateCreated) : null,
    });
  }, [image]);

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...formData,
        dateCreated: formData.dateCreated ? formData.dateCreated.format('YYYY/MM/DD HH:mm:ss') : null,
      });
      message.success('属性已保存！');
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  if (!visible) return null;

  return (
    <Draggable nodeRef={nodeRef} handle=".window-handle" bounds="body">
      <WindowContainer ref={nodeRef} defaultPosition={defaultPosition} width={width}>
        <WindowHeader className="window-handle" headerColor={headerColor}>
          <span>{title}</span>
          <div>
            {!isEditing && (
              <Button
                type="text"
                size="small"
                style={{ color: "white", marginRight: 8 }}
                onClick={() => setIsEditing(true)}
              >
                编辑
              </Button>
            )}
            <Button type="text" size="small" style={{ color: 'white' }} onClick={onClose}>
              ✕
            </Button>
          </div>
        </WindowHeader>
        <WindowContent maxHeight={maxHeight}>
          {isEditing ? (
            <>
              <div className="field-group">
                <label>拍摄时间</label>
                <DatePicker
                  showTime
                  value={formData.dateCreated}
                  onChange={(date) => {
                    setFormData(prev => ({
                      ...prev,
                      dateCreated: date
                    }));
                  }}
                  placeholder="拍摄时间"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="field-group">
                <label>相机品牌</label>
                <InputField
                  type="text"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="相机品牌"
                />
              </div>
              <div className="field-group">
                <label>相机型号</label>
                <InputField
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="相机型号"
                />
              </div>
              <div className="field-group">
                <label>软件</label>
                <InputField
                  type="text"
                  value={formData.software}
                  onChange={(e) => setFormData({ ...formData, software: e.target.value })}
                  placeholder="软件"
                />
              </div>
              <div className="field-group">
                <label>作者</label>
                <InputField
                  type="text"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  placeholder="作者"
                />
              </div>
              <ButtonGroup>
                <Button onClick={handleCancelEdit}>取消</Button>
                <Button type="primary" onClick={handleSave}>保存</Button>
              </ButtonGroup>
            </>
          ) : (
            <>
              <p style={{ textAlign: 'left' }}>拍摄时间: {formData.dateCreated ? formData.dateCreated.format('YYYY/MM/DD HH:mm:ss') : '未设置'}</p>
              <p style={{ textAlign: 'left' }}>相机品牌: {formData.make}</p>
              <p style={{ textAlign: 'left' }}>相机型号: {formData.model}</p>
              <p style={{ textAlign: 'left' }}>软件: {formData.software}</p>
              <p style={{ textAlign: 'left' }}>作者: {formData.artist}</p>
            </>
          )}
        </WindowContent>
      </WindowContainer>
    </Draggable>
  );
};

export default ImagePropertiesDialog; 