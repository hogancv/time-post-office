import React, { useMemo, useState, useRef, useEffect } from "react";
import { Popover, Empty, Button } from "antd";
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import Viewer from "react-viewer";
import DraggableNoteWindow from "../DraggableNoteWindow";
import TimelineNav from "../TimelineSlider";
import DraggablePropertiesWindow from "../DraggablePropertiesWindow";
import useImageViewer from "../../hooks/useImageViewer";
import {
  NotesContainer,
  ContentWrapper,
  StyledMasonry,
  ImageCard,
  NoteContent,
  DateLabel,
  EmptyContainer,
  SortButtonContainer,
  StyledTitle,
} from "./NotesView.styled";

const NotesView = ({ images, onMetadataUpdate }) => {
  const [imagesData, setImagesData] = useState(images);
  const [sortDirection, setSortDirection] = useState("asc");
  const masonryRef = useRef(null);

  // 首先计算具有笔记的图片
  const imagesWithNotes = useMemo(() => {
    let filteredImages = [...imagesData].filter(
      (img) => img.notes && img.notes.trim().length > 0
    );

    return filteredImages.sort((a, b) => {
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
  }, [imagesData, sortDirection]);

  // 使用自定义Hook处理图片查看相关逻辑
  const {
    visible,
    setVisible,
    currentIndex,
    noteWindowVisible,
    setNoteWindowVisible,
    propertiesWindowVisible,
    setPropertiesWindowVisible,
    currentNoteContent,
    selectedImage, // 添加了selectedImage
    activeTimeItems,
    viewerImages,
    handleImageClick,
    handleImageChange,
    handleViewerClose,
    handleSaveNote,
    handleImagePropertiesSave,
    handleTimePointChange,
    resetHighlights,
  } = useImageViewer(imagesWithNotes, onMetadataUpdate, sortDirection);

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "desc" ? "asc" : "desc");
  };

  // 当外部images变化时更新内部状态
  useEffect(() => {
    setImagesData(images);
  }, [images]);

  // 处理时间点选择后DOM操作
  const handleTimePointSelect = (date, isUnknown) => {
    const result = handleTimePointChange(date, isUnknown);
    if (!result) return;

    const { highlightPaths } = result;

    // 延迟执行DOM操作，确保React已经完成渲染
    setTimeout(() => {
      // 首先清除所有之前的高亮
      const allCards = document.querySelectorAll(".masonry-grid .image-card");
      allCards.forEach((card) => {
        card.classList.remove("highlight-card");
      });

      // 然后对匹配的图片进行高亮处理
      let firstCardToScroll = null;

      highlightPaths.forEach((path) => {
        const cardElement = document.querySelector(
          `.image-card[data-path="${path}"]`
        );
        if (cardElement) {
          cardElement.classList.add("highlight-card");

          // 记录第一个找到的卡片，用于滚动
          if (!firstCardToScroll) {
            firstCardToScroll = cardElement;
          }
        }
      });

      // 滚动到第一个高亮的卡片
      if (firstCardToScroll) {
        firstCardToScroll.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 300); // 增加延迟确保DOM完全加载
  };

  // 重置高亮并清除DOM中的高亮类
  const resetHighlightDOM = () => {
    resetHighlights();
    // 清除DOM中的高亮类
    const highlightedCards = document.querySelectorAll(".highlight-card");
    highlightedCards.forEach((el) => {
      el.classList.remove("highlight-card");
    });
  };

  // 处理图片点击的封装，与Hook集成
  const onImageClick = (index) => {
    const image = imagesWithNotes[index];
    handleImageClick(image, index);
  };

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
            style={{ marginRight: 8 }}
          >
            {sortDirection === "desc" ? "时间降序" : "时间升序"}
          </Button>

          {activeTimeItems.length > 0 && (
            <Button onClick={resetHighlightDOM}>
              清除高亮 ({activeTimeItems.length})
            </Button>
          )}
        </SortButtonContainer>

        {imagesWithNotes.length > 0 ? (
          <StyledMasonry
            ref={masonryRef}
            breakpointCols={breakpointColumns}
            className="masonry-grid"
            columnClassName="masonry-column"
          >
            {imagesWithNotes.map((image, index) => (
              <ImageCard
                key={image.path || index}
                onClick={() => onImageClick(index)}
                className={
                  activeTimeItems.includes(image.path || image.url)
                    ? "highlight-card image-card"
                    : "image-card"
                }
                data-path={image.path || image.url}
                data-index={index}
              >
                <img
                  src={image.url}
                  alt={image.name || "图片"}
                  loading="lazy"
                />
                {image.dateCreated && image.dateCreated !== "未知" && (
                  <DateLabel>
                    {new Date(image.dateCreated).toLocaleDateString()}
                  </DateLabel>
                )}
                {(!image.dateCreated || image.dateCreated === "未知") && (
                  <DateLabel className="unknown-date">未知时间</DateLabel>
                )}
                <NoteContent>
                  <Popover
                    content={
                      <div
                        style={{ whiteSpace: "pre-wrap", maxWidth: "400px" }}
                      >
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
        ) : (
          <EmptyContainer>
            <Empty description="没有找到笔记" />
          </EmptyContainer>
        )}
      </ContentWrapper>

      {/* 图片查看器 */}
      {imagesWithNotes.length > 0 && (
        <Viewer
          visible={visible}
          onClose={handleViewerClose}
          images={viewerImages}
          activeIndex={currentIndex}
          onChange={handleImageChange}
          onMaskClick={() => setVisible(false)}
          zoomable={true}
          rotatable={true}
          scalable={true}
        />
      )}

      {/* 时间导航组件 */}
      <TimelineNav
        images={imagesWithNotes}
        onTimePointChange={handleTimePointSelect}
        sortDirection={sortDirection}
      />
      {/* 可拖动笔记窗口组件 */}
      <DraggableNoteWindow
        title="图片笔记"
        content={currentNoteContent}
        visible={visible && noteWindowVisible}
        onClose={() => setNoteWindowVisible(false)}
        defaultPosition={{ x: 30, y: 128 }}
        width={300}
        maxHeight={300}
        headerColor="#1890ff"
        editable={true}
        onSave={handleSaveNote}
      />

      {/* 图片属性窗口组件 */}
      {selectedImage && (
        <DraggablePropertiesWindow
          title="图片属性"
          image={visible && selectedImage}
          visible={visible && propertiesWindowVisible}
          onClose={() => setPropertiesWindowVisible(false)}
          defaultPosition={{ x: 30, y: 520 }}
          width={300}
          maxHeight={500}
          headerColor="#1890ff"
          onSave={handleImagePropertiesSave}
        />
      )}
    </NotesContainer>
  );
};

export default NotesView;
