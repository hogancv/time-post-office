import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { Popover, message } from "antd";
import { Title } from "./ImageManager.styled";
import Viewer from "react-viewer";
import DraggableNoteWindow from "./DraggableNoteWindow";

const NotesContainer = styled.div`
  flex: 1;
  margin-left: 200px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1400px;
`;

const ImageGrid = styled.div`
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  gap: 20px;
  padding: 20px 0;
`;

const ImageCard = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-5px);
  }

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
`;

const NoteContent = styled.div`
  padding: 10px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
`;

const NotesView = ({ images, onMetadataUpdate }) => {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [noteWindowVisible, setNoteWindowVisible] = useState(false);
  const [currentNoteContent, setCurrentNoteContent] = useState("");
  const [imagesData, setImagesData] = useState(images);

  const imagesWithNotes = useMemo(() => {
    return imagesData.filter((img) => img.notes && img.notes.trim().length > 0);
  }, [imagesData]);

  const handleMetadataUpdate = async (imagePath, updates) => {
    await onMetadataUpdate(imagePath, updates);
  };

  // 当外部images变化时更新内部状态
  React.useEffect(() => {
    setImagesData(images);
  }, [images]);

  const onImageClick = (index) => {
    setCurrentIndex(index);
    setVisible(true);

    // 显示笔记窗口
    if (imagesWithNotes[index]?.notes) {
      setCurrentNoteContent(imagesWithNotes[index].notes);
      setNoteWindowVisible(true);
    }
  };

  // 处理图片切换
  const handleImageChange = (activeImage, index) => {
    setCurrentIndex(index);

    // 更新笔记内容
    if (imagesWithNotes[index]?.notes) {
      setCurrentNoteContent(imagesWithNotes[index].notes);
      setNoteWindowVisible(true);
    } else {
      setNoteWindowVisible(false);
    }
  };

  // 保存笔记内容
  const handleSaveNote = async (content) => {
    const updatedImages = [...imagesData];
    const currentImage = imagesWithNotes[currentIndex];

    // 找到对应的图片并更新笔记
    const originalIndex = updatedImages.findIndex(
      (img) => img.path === currentImage.path || img.url === currentImage.url
    );

    if (originalIndex !== -1) {
      // 先更新本地状态
      updatedImages[originalIndex] = {
        ...updatedImages[originalIndex],
        notes: content,
      };
      setImagesData(updatedImages);
      setCurrentNoteContent(content);

      // 调用 handleMetadataUpdate 方法以持久化更改
      try {
        await handleMetadataUpdate(currentImage.path, { notes: content });
      } catch (error) {
        console.error("保存笔记失败:", error);
        message.error("保存笔记失败，请重试");
      }
    }
  };

  // 准备图片数据
  const viewerImages = useMemo(() => {
    return imagesWithNotes.map((img) => ({
      src: img.url || "",
      alt: img.name || "",
    }));
  }, [imagesWithNotes]);

  return (
    <NotesContainer>
      <ContentWrapper>
        <Title>笔记列表</Title>
        <ImageGrid>
          {imagesWithNotes.map((image, index) => (
            <ImageCard
              key={image.path || index}
              onClick={() => onImageClick(index)}
            >
              <img src={image.url} alt={image.name || "图片"} loading="lazy" />
              <NoteContent>
                <Popover
                  content={image.notes}
                  title="完整笔记"
                  trigger="hover"
                  placement="bottom"
                >
                  <p>
                    {image.notes?.length > 50
                      ? `${image.notes.slice(0, 50)}...`
                      : image.notes}
                  </p>
                </Popover>
              </NoteContent>
            </ImageCard>
          ))}
        </ImageGrid>
        {imagesWithNotes.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>暂无笔记</p>
          </div>
        )}
      </ContentWrapper>

      {/* 图片查看器 */}
      {imagesWithNotes.length > 0 && (
        <Viewer
          visible={visible}
          onClose={() => {
            setVisible(false);
            setNoteWindowVisible(false);
          }}
          images={viewerImages}
          activeIndex={currentIndex}
          onChange={handleImageChange}
          onMaskClick={() => setVisible(false)}
          zoomable={true}
          rotatable={true}
          scalable={true}
        />
      )}

      {/* 使用可拖动笔记窗口组件 */}
      <DraggableNoteWindow
        title="图片笔记"
        content={currentNoteContent || "无笔记内容"}
        visible={visible && noteWindowVisible}
        onClose={() => setNoteWindowVisible(false)}
        defaultPosition={{ x: 30, y: 128 }}
        width={300}
        maxHeight={300}
        headerColor="#1890ff"
        editable={true}
        onSave={handleSaveNote}
      />
    </NotesContainer>
  );
};

export default NotesView;
