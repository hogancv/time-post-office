import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from './ImageManager.styled';
import { DatePicker, message } from 'antd';
import dayjs from 'dayjs';

const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogContent = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  min-width: 400px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;

  h3 {
    margin: 0 0 20px;
    font-size: 18px;
    color: #333;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  input, textarea {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    &:focus {
      outline: none;
      border-color: #40a9ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }

  .button-group {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    label {
      font-size: 14px;
      color: #666;
    }
  }
`;

const EditDialog = ({ image, onSave, onClose }) => {
  const isNoteMode = image.editMode === 'note';
  
  
  const [formData, setFormData] = useState({
    dateCreated: image.dateCreated ? dayjs(image.dateCreated, 'YYYY/M/D HH:mm:ss') : null,
    model: image.model,
    make: image.make,
    software: image.software,
    artist: image.artist,
    notes: image.notes || '',
  });



  const handleSubmit = (e) => {
    e.preventDefault();
    const submittedData = {
      ...formData,
      dateCreated: formData.dateCreated ? formData.dateCreated.format('YYYY/M/D HH:mm:ss') : '',
    };
    onSave(submittedData);
    message.success('保存成功！');
  };

  return (
    <DialogOverlay onClick={onClose}>
      <DialogContent onClick={e => e.stopPropagation()}>
        <h3>{isNoteMode ? '编辑笔记' : '编辑属性'}</h3>
        <form onSubmit={handleSubmit}>
          {isNoteMode ? (
            <div className="field-group">
              <label>笔记内容</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                placeholder="添加笔记..."
                style={{ minHeight: '150px' }}
              />
            </div>
          ) : (
            <>
              <div className="field-group">
                <label>拍摄时间</label>
                <DatePicker
                  showTime
                  value={formData.dateCreated}
                  defaultValue={formData.dateCreated}
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
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    make: e.target.value
                  }))}
                  placeholder="相机品牌"
                />
              </div>
              <div className="field-group">
                <label>相机型号</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    model: e.target.value
                  }))}
                  placeholder="相机型号"
                />
              </div>
              <div className="field-group">
                <label>软件</label>
                <input
                  type="text"
                  value={formData.software}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    software: e.target.value
                  }))}
                  placeholder="软件"
                />
              </div>
              <div className="field-group">
                <label>作者</label>
                <input
                  type="text"
                  value={formData.artist}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    artist: e.target.value
                  }))}
                  placeholder="作者"
                />
              </div>
            </>
          )}
          <div className="button-group">
            <Button type="button" onClick={onClose}>取消</Button>
            <Button type="submit" style={{ background: '#1890ff' }}>保存</Button>
          </div>
        </form>
      </DialogContent>
    </DialogOverlay>
  );
};

export default EditDialog;