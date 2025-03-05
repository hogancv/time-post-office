import React, { useMemo, useState, useRef } from "react";
import { Popover, message, Empty, Button, Badge } from "antd";
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import Viewer from "react-viewer";
import DraggableNoteWindow from "./DraggableNoteWindow";
import TimelineNav from "./TimelineSlider";
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
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [noteWindowVisible, setNoteWindowVisible] = useState(false);
  const [currentNoteContent, setCurrentNoteContent] = useState("");
  const [imagesData, setImagesData] = useState(images);
  const [sortDirection, setSortDirection] = useState("asc");
  const [timeFilter, setTimeFilter] = useState(null);
  const [activeTimeItems, setActiveTimeItems] = useState([]);
  const masonryRef = useRef(null); // 添加对瀑布流容器的引用

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "desc" ? "asc" : "desc");
  };

  const imagesWithNotes = useMemo(() => {
    let filteredImages = [...imagesData].filter(
      (img) => img.notes && img.notes.trim().length > 0
    );

    // 应用时间筛选
    if (timeFilter && timeFilter.start && timeFilter.end) {
      filteredImages = filteredImages.filter((img) => {
        if (!img.dateCreated || img.dateCreated === "未知") return false;

        const imgDate = new Date(img.dateCreated);
        return imgDate >= timeFilter.start && imgDate <= timeFilter.end;
      });
    }

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
  }, [imagesData, sortDirection, timeFilter]);

  // 处理时间点选择，定位到对应的图片，但不筛选列表
  const handleTimePointChange = (date, isUnknown) => {
    // 清除之前的高亮状态和数据
    setActiveTimeItems([]);

    // 如果是重置（点击null），直接返回
    if (!date && !isUnknown) {
      return;
    }

    // 查找符合条件的图片
    let targetImages = [];

    if (isUnknown) {
      // 查找未知日期的图片
      targetImages = imagesWithNotes.filter(
        (img) =>
          !img.dateCreated ||
          img.dateCreated === "未知" ||
          isNaN(new Date(img.dateCreated).getTime())
      );
    } else if (date) {
      // 查找指定年月的图片
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      targetImages = imagesWithNotes.filter((img) => {
        if (img.dateCreated && img.dateCreated !== "未知") {
          try {
            const imgDate = new Date(img.dateCreated);
            if (!isNaN(imgDate.getTime())) {
              return (
                imgDate.getFullYear() === year &&
                imgDate.getMonth() + 1 === month
              );
            }
          } catch (e) {
            return false;
          }
        }
        return false;
      });
    }

    // 如果找不到匹配的图片，提前返回
    if (!targetImages || targetImages.length === 0) {
      return;
    }

    // 记录当前高亮的图片路径
    const highlightPaths = targetImages.map((img) => img.path || img.url);
    setActiveTimeItems(highlightPaths);

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

  // 重置高亮
  const resetHighlights = () => {
    // 清除高亮状态
    setActiveTimeItems([]);

    // 清除DOM中的高亮类
    const highlightedCards = document.querySelectorAll(".highlight-card");
    highlightedCards.forEach((el) => {
      el.classList.remove("highlight-card");
    });
  };

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
            style={{ marginRight: 8 }}
          >
            {sortDirection === "desc" ? "时间降序" : "时间升序"}
          </Button>

          {activeTimeItems.length > 0 && (
            <Button onClick={resetHighlights}>
              清除高亮 ({activeTimeItems.length})
            </Button>
          )}
        </SortButtonContainer>

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
              <img src={image.url} alt={image.name || "图片"} loading="lazy" />
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
              description={timeFilter ? "该时间范围内无笔记" : "暂无笔记"}
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

      {/* 时间导航组件 - 现在使用文字列表形式 */}
      <TimelineNav
        images={imagesData}
        onTimePointChange={handleTimePointChange}
        sortDirection={sortDirection}
      />
    </NotesContainer>
  );
};

export default NotesView;
