import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { Popover, message, Empty, Button } from "antd"; // 导入Button
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons"; // 导入排序图标
import { Title } from "./ImageManager.styled";
import Viewer from "react-viewer";
import DraggableNoteWindow from "./DraggableNoteWindow";
import Masonry from "react-masonry-css";

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
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

// 自定义瀑布流样式
const StyledMasonry = styled(Masonry)`
  display: flex;
  width: 100%;
  margin-left: -24px; /* 抵消列间距 */

  .masonry-column {
    padding-left: 24px; /* 列间距 */
    background-clip: padding-box;
  }
`;

const ImageCard = styled.div`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s;
  background-color: white;
  margin-bottom: 24px; /* 卡片之间的垂直间距 */

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }

  img {
    width: 100%;
    height: auto; /* 高度自适应，以适应瀑布流 */
    object-fit: cover;
  }
`;

const NoteContent = styled.div`
  padding: 12px 16px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
  min-height: 60px;
  max-height: 150px;
  overflow: hidden;

  p {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    color: #333;
    font-size: 14px;
    line-height: 1.5;
  }
`;

const StyledTitle = styled(Title)`
  margin-bottom: 24px;
  font-size: 24px;
  color: #333;
  position: relative;
  padding-bottom: 10px;

  &:after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 60px;
    height: 3px;
    background-color: #1890ff;
  }
`;

const EmptyContainer = styled.div`
  padding: 40px;
  text-align: center;
`;

const DateLabel = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
`;

const SortButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
`;

const NotesView = ({ images, onMetadataUpdate }) => {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [noteWindowVisible, setNoteWindowVisible] = useState(false);
  const [currentNoteContent, setCurrentNoteContent] = useState("");
  const [imagesData, setImagesData] = useState(images);
  const [sortDirection, setSortDirection] = useState("desc"); // 默认降序，新的在前

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "desc" ? "asc" : "desc");
  };

  const imagesWithNotes = useMemo(() => {
    const sortedImages = [...imagesData]
      .filter((img) => img.notes && img.notes.trim().length > 0)
      .sort((a, b) => {
        // 先处理未知日期的情况
        if (a.dateCreated === "未知" && b.dateCreated !== "未知") return 1;
        if (a.dateCreated !== "未知" && b.dateCreated === "未知") return -1;
        if (a.dateCreated === "未知" && b.dateCreated === "未知") return 0;

        // 处理有日期的情况
        const dateA = new Date(a.dateCreated);
        const dateB = new Date(b.dateCreated);

        // 根据排序方向决定比较方式
        if (sortDirection === "desc") {
          return dateB - dateA; // 降序，新的在前
        } else {
          return dateA - dateB; // 升序，旧的在前
        }
      });

    return sortedImages;
  }, [imagesData, sortDirection]);

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

  // 确定不同屏幕宽度下的列数
  const breakpointColumns = {
    default: 4, // 默认4列
    1400: 3, // 宽度 <= 1400px 时是3列
    1100: 2, // 宽度 <= 1100px 时是2列
    700: 1, // 宽度 <= 700px 时是1列
  };

  return (
    <NotesContainer>
      <ContentWrapper>
        <StyledTitle>笔记列表</StyledTitle>

        <SortButtonContainer>
          <Button
            type="primary"
            icon={
              sortDirection === "desc" ? (
                <SortDescendingOutlined />
              ) : (
                <SortAscendingOutlined />
              )
            }
            onClick={toggleSortDirection}
          >
            {sortDirection === "desc" ? "时间降序" : "时间升序"}
          </Button>
        </SortButtonContainer>

        <StyledMasonry
          breakpointCols={breakpointColumns}
          className="masonry-grid"
          columnClassName="masonry-column"
        >
          {imagesWithNotes.map((image, index) => (
            <ImageCard
              key={image.path || index}
              onClick={() => onImageClick(index)}
            >
              <img src={image.url} alt={image.name || "图片"} loading="lazy" />
              {image.dateCreated && (
                <DateLabel>
                  {new Date(image.dateCreated).toLocaleDateString()}
                </DateLabel>
              )}
              <NoteContent>
                <Popover
                  content={
                    <div style={{ whiteSpace: "pre-wrap", maxWidth: "400px" }}>
                      {image.notes}
                    </div>
                  }
                  title={
                    <div style={{ fontWeight: "bold" }}>
                      {image.name || "图片笔记"}
                    </div>
                  }
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
        </StyledMasonry>
        {imagesWithNotes.length === 0 && (
          <EmptyContainer>
            <Empty
              description="暂无笔记"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </EmptyContainer>
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
