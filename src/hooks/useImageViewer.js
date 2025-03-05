import { useState, useEffect, useMemo } from "react";

/**
 * 自定义Hook，用于处理图片查看、笔记管理和属性窗口的共享逻辑
 * @param {Array} images 图片数组
 * @param {Function} onMetadataUpdate 元数据更新回调函数
 * @returns {Object} 图片查看器相关状态和方法
 */
const useImageViewer = (images, onMetadataUpdate) => {
  // 共享状态
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [noteWindowVisible, setNoteWindowVisible] = useState(false);
  const [propertiesWindowVisible, setPropertiesWindowVisible] = useState(false);
  const [currentNoteContent, setCurrentNoteContent] = useState("");
  const [activeTimeItems, setActiveTimeItems] = useState([]);

  // 准备查看器图片数据
  const viewerImages = useMemo(() => {
    return images.map((img) => ({
      src: img.url || "",
      alt: img.name || "",
      path: img.path || img.url, // 确保每个图片有唯一标识
      notes: img.notes || "",
    }));
  }, [images]);

  // 打开图片查看器
  const handleImageClick = (image, index) => {
    if (!image) return; // 增加对空图片的检查
    setCurrentIndex(index);
    setSelectedImage(image);
    setVisible(true);
    setNoteWindowVisible(true);
    setPropertiesWindowVisible(true);
  };

  // 处理图片切换
  const handleImageChange = (activeImage, index) => {
    setCurrentIndex(index);
    const currentImage = images[index];
    setSelectedImage(currentImage);
    console.log("当前图片:", activeImage);
  };

  // 关闭图片查看器
  const handleViewerClose = () => {
    setVisible(false);
    setNoteWindowVisible(false);
    setPropertiesWindowVisible(false);
  };

  // 保存笔记内容
  const handleSaveNote = async (content) => {
    if (selectedImage) {
      // 更新元数据
      try {
        await onMetadataUpdate(selectedImage.path, { notes: content });
        setCurrentNoteContent(content);
        // 更新选中的图片
        setSelectedImage({ ...selectedImage, notes: content });
      } catch (error) {
        console.error("保存笔记失败:", error);
      }
    }
  };

  // 保存图片属性
  const handleImagePropertiesSave = async (updatedProperties) => {
    if (selectedImage) {
      try {
        await onMetadataUpdate(selectedImage.path, updatedProperties);
        setSelectedImage({ ...selectedImage, ...updatedProperties });
      } catch (error) {
        console.error("更新图片属性失败:", error);
      }
    }
  };

  // 处理时间点选择
  const handleTimePointChange = (date, isUnknown) => {
    // 清除之前的高亮状态
    setActiveTimeItems([]);

    if (!date && !isUnknown) {
      return;
    }

    // 查找符合条件的图片
    let targetImages = [];

    if (isUnknown) {
      // 查找未知日期的图片
      targetImages = images.filter(
        (img) =>
          !img.dateCreated ||
          img.dateCreated === "未知" ||
          isNaN(new Date(img.dateCreated).getTime())
      );
    } else if (date) {
      // 查找指定年月的图片
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      targetImages = images.filter((img) => {
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

    return { targetImages, highlightPaths };
  };

  // 重置高亮
  const resetHighlights = () => {
    setActiveTimeItems([]);
    return true;
  };

  // 监控 selectedImage 的变化，自动更新 currentNoteContent
  useEffect(() => {
    if (selectedImage) {
      setCurrentNoteContent(selectedImage.notes?.trim() || "暂无笔记");
    }
  }, [selectedImage]);

  return {
    visible,
    setVisible,
    currentIndex,
    setCurrentIndex,
    selectedImage,
    setSelectedImage,
    noteWindowVisible,
    setNoteWindowVisible,
    propertiesWindowVisible,
    setPropertiesWindowVisible,
    currentNoteContent,
    setCurrentNoteContent,
    activeTimeItems,
    setActiveTimeItems,
    viewerImages,
    handleImageClick,
    handleImageChange,
    handleViewerClose,
    handleSaveNote,
    handleImagePropertiesSave,
    handleTimePointChange,
    resetHighlights,
  };
};

export default useImageViewer;
