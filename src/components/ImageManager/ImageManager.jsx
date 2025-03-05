import React, { useState, useRef, useMemo, useEffect } from "react";
import Viewer from "react-viewer";
import exifr from "exifr";
import EditDialog from "../EditDialog";
import {
  ImageGrid,
  ImageCard,
  FilterBar,
  MonthGroup,
  MainContainer,
  ContentContainer,
  Title,
  ContentWrapper,
  UploadBox,
  UploadIcon,
  UploadText,
  UploadHint,
  ImageInfoPopover,
  InfoIndicator,
  DateLabel,
} from "./ImageManager.styled";
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import { imageDB } from "../../utils/imageDB";
import DraggableNoteWindow from "../DraggableNoteWindow";
import TimelineNav from "../TimelineSlider";
import DraggablePropertiesWindow from "../DraggablePropertiesWindow";
import useImageViewer from "../../hooks/useImageViewer";
import { Spin, Alert, Popover, Select, Button } from "antd";

const ImageManager = ({
  images,
  setImages,
  activeFilter,
  onMetadataUpdate,
  showUploader,
  setShowUploader,
  onReset,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedModel, setSelectedModel] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const inputRef = useRef(null);
  const [editingImage, setEditingImage] = useState(null);
  const [highlightedMonth, setHighlightedMonth] = useState(null);
  const monthRefs = useRef({});

  // 获取所有不重复的相机型号
  const uniqueModels = useMemo(() => {
    const models = new Set(images.map((img) => img.model));
    const modelArray = Array.from(models);
    const sortedModels = modelArray
      .filter((model) => model !== "未知")
      .sort((a, b) => a.localeCompare(b));

    if (modelArray.includes("未知")) {
      sortedModels.push("未知");
    }
    return sortedModels;
  }, [images]);

  // 按月份分组的图片
  const groupedImages = useMemo(() => {
    // 首先根据筛选条件过滤图片
    let filtered = images;
    if (activeFilter === "hasNotes") {
      filtered = images.filter(
        (img) => img.notes && img.notes.trim().length > 0
      );
    }

    // 然后根据相机型号筛选
    filtered = filtered.filter(
      (img) => selectedModel === "all" || img.model === selectedModel
    );

    // 排序逻辑
    const sorted = [...filtered].sort((a, b) => {
      if (a.dateCreated === "未知" && b.dateCreated === "未知") return 0;
      if (a.dateCreated === "未知") return 1;
      if (b.dateCreated === "未知") return -1;
      const dateA = new Date(a.dateCreated);
      const dateB = new Date(b.dateCreated);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    // 分组逻辑
    const groups = {};
    sorted.forEach((img) => {
      let monthKey;
      if (img.dateCreated === "未知") {
        monthKey = "未知时间";
      } else {
        const date = new Date(img.dateCreated);
        monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`;
      }
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(img);
    });

    // 月份排序逻辑
    const orderedGroups = {};
    const monthKeys = Object.keys(groups).sort((a, b) => {
      if (a === "未知时间") return 1;
      if (b === "未知时间") return -1;
      if (sortOrder === "desc") {
        return b.localeCompare(a);
      }
      return a.localeCompare(b);
    });

    monthKeys.forEach((key) => {
      orderedGroups[key] = groups[key];
    });

    return orderedGroups;
  }, [images, selectedModel, sortOrder, activeFilter]);

  // 创建扁平化的已筛选图片数组，用于图片查看器
  const filteredImages = useMemo(() => {
    return Object.values(groupedImages).flat();
  }, [groupedImages]);

  // 使用自定义Hook处理图片查看相关逻辑
  const {
    visible,
    setVisible,
    currentIndex,
    selectedImage,
    noteWindowVisible,
    setNoteWindowVisible,
    propertiesWindowVisible,
    setPropertiesWindowVisible,
    currentNoteContent,
    viewerImages,
    handleImageClick: baseHandleImageClick,
    handleImageChange,
    handleSaveNote,
    handleImagePropertiesSave,
  } = useImageViewer(filteredImages, onMetadataUpdate, sortOrder);

  // 初始化 IndexedDB
  useEffect(() => {
    imageDB.init().catch(console.error);
  }, []);

  const getExifData = async (file) => {
    try {
      const options = {
        pick: ["Make", "Model", "Software", "Artist", "DateTimeOriginal"],
      };

      const exifData = await exifr.parse(file, options);

      return {
        dateCreated: exifData?.DateTimeOriginal
          ? new Date(exifData.DateTimeOriginal).toLocaleString()
          : "未知",
        make: exifData?.Make || "未知",
        model: exifData?.Model || "未知",
        software: exifData?.Software || "未知",
        artist: exifData?.Artist || "未知",
      };
    } catch (error) {
      console.warn("读取EXIF数据失败:", error);
      return {
        dateCreated: "未知",
        make: "未知",
        model: "未知",
        software: "未知",
        artist: "未知",
      };
    }
  };

  const handleFolderSelect = async (event) => {
    setError("");
    setIsLoading(true);

    try {
      const files = Array.from(event.target.files || []);

      if (files.length === 0) {
        setError("未选择任何文件，请重试");
        setIsLoading(false);
        return;
      }

      const imageFiles = files.filter(
        (file) =>
          file.type.startsWith("image/") ||
          file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)
      );

      if (imageFiles.length === 0) {
        setError("所选文件夹中没有找到图片文件");
        setIsLoading(false);
        return;
      }

      const processedImages = await Promise.all(
        imageFiles.map(async (file) => {
          try {
            const exifData = await getExifData(file);
            const imagePath = file.webkitRelativePath || file.name;
            const savedMetadata = await imageDB.getMetadata(imagePath);

            const imageData = {
              name: file.name,
              path: imagePath,
              file: file,
              url: URL.createObjectURL(file),
              type: file.type || "未知格式",
              size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
              ...exifData,
              // 使用保存的元数据覆盖默认值
              ...(savedMetadata || {}),
            };

            return imageData;
          } catch (error) {
            console.error("处理图片失败:", error);
            return null;
          }
        })
      );

      const validImages = processedImages.filter((img) => img !== null);

      if (validImages.length === 0) {
        setError("无法处理所选图片，请重试");
      } else {
        setImages(validImages);
        setShowUploader(false);
      }
    } catch (error) {
      console.error("处理文件夹失败:", error);
      setError("处理文件夹时出错，请重试");
    }

    setIsLoading(false);
  };

  const handleReset = () => {
    onReset();
    setSelectedModel("all");
    setSortOrder("desc");
    setHighlightedMonth(null);
  };

  // 处理时间点变化 - 滚动到对应月份
  const handleTimePointChange = (date, isUnknown) => {
    let targetMonth;

    if (isUnknown) {
      targetMonth = "未知时间";
    } else if (date) {
      const yearDate = new Date(date);
      targetMonth = `${yearDate.getFullYear()}年${yearDate.getMonth() + 1}月`;
    } else {
      // 如果没有选择时间点，不执行任何操作
      setHighlightedMonth(null);
      return;
    }

    // 设置高亮月份
    setHighlightedMonth(targetMonth);

    // 检查该月份的引用是否存在
    if (monthRefs.current[targetMonth]) {
      // 滚动到该月份
      monthRefs.current[targetMonth].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // 导出配置
  const handleExportConfig = async () => {
    try {
      const blob = await imageDB.exportConfig();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "image-metadata-config.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("导出配置失败:", error);
      setError("导出配置失败，请重试");
    }
  };

  // 导入配置
  const handleImportConfig = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      await imageDB.importConfig(file);
      // 重新加载图片列表
      handleFolderSelect({ target: { files: inputRef.current.files } });
    } catch (error) {
      console.error("导入配置失败:", error);
      setError("导入配置失败，请检查文件格式");
    }
  };

  // 处理图片点击，需要找到图片在filteredImages中的索引
  const handleImageClick = (image) => {
    const index = filteredImages.findIndex(
      (img) => img.path === image.path || img.url === image.url
    );
    if (index !== -1) {
      baseHandleImageClick(image, index);
    }
  };

  return (
    <MainContainer>
      <ContentContainer>
        <Title>图片管理器</Title>
        <ContentWrapper>
          {/* 可拖动属性窗口 */}
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
              resetEditing={!visible}
            />
          )}

          {/* 可拖动笔记窗口 */}
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
            resetEditing={!visible}
          />

          {/* 时间轴导航组件 */}
          {!showUploader && images.length > 0 && (
            <TimelineNav
              images={images}
              onTimePointChange={handleTimePointChange}
              sortDirection={sortOrder}
            />
          )}

          {showUploader ? (
            <UploadBox
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                ref={inputRef}
                type="file"
                webkitdirectory=""
                directory=""
                onChange={handleFolderSelect}
                id="folder-input"
                multiple
                accept="image/*"
                style={{ display: "none" }}
              />
              <UploadIcon
                viewBox="0 0 24 24"
                width="48"
                height="48"
                stroke="#1890ff"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </UploadIcon>
              <UploadText>点击或拖放文件夹到此处</UploadText>
              <UploadHint>支持 JPG、PNG、GIF 等图片格式</UploadHint>
            </UploadBox>
          ) : (
            <>
              <FilterBar>
                <Select
                  value={selectedModel}
                  onChange={(value) => setSelectedModel(value)}
                  style={{ width: 200, marginRight: 10 }}
                >
                  <Select.Option value="all">所有相机型号</Select.Option>
                  {uniqueModels.map((model) => (
                    <Select.Option key={model} value={model}>
                      {model}
                    </Select.Option>
                  ))}
                </Select>

                <Button
                  type="primary"
                  icon={
                    sortOrder === "desc" ? (
                      <SortDescendingOutlined />
                    ) : (
                      <SortAscendingOutlined />
                    )
                  }
                  onClick={() =>
                    setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                  }
                  style={{ marginRight: 8 }}
                >
                  {sortOrder === "desc" ? "时间降序" : "时间升序"}
                </Button>

                <Button
                  type="primary"
                  danger
                  onClick={handleReset}
                  style={{ marginRight: 10 }}
                >
                  重新选择文件夹
                </Button>

                <Button
                  type="default"
                  onClick={handleExportConfig}
                  style={{ marginRight: 10 }}
                >
                  导出配置
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportConfig}
                  style={{ display: "none" }}
                  id="config-import"
                />
                <Button
                  type="default"
                  onClick={() =>
                    document.getElementById("config-import").click()
                  }
                >
                  导入配置
                </Button>
              </FilterBar>

              {Object.entries(groupedImages).map(([monthKey, monthImages]) => (
                <MonthGroup
                  key={monthKey}
                  ref={(el) => (monthRefs.current[monthKey] = el)}
                  style={{
                    backgroundColor:
                      monthKey === highlightedMonth
                        ? "rgba(24, 144, 255, 0.05)"
                        : "transparent",
                    borderLeft:
                      monthKey === highlightedMonth
                        ? "4px solid #1890ff"
                        : "none",
                    transition:
                      "background-color 0.5s ease, border-left 0.5s ease",
                    paddingLeft:
                      monthKey === highlightedMonth ? "12px" : "16px",
                    scrollMarginTop: "90px", // 滚动时留出顶部空间
                  }}
                >
                  <h2
                    style={{
                      color:
                        monthKey === highlightedMonth ? "#1890ff" : "inherit",
                      transition: "color 0.5s ease",
                    }}
                  >
                    {monthKey}
                    {monthKey === highlightedMonth && (
                      <span
                        style={{
                          marginLeft: "10px",
                          fontSize: "0.8em",
                          color: "#1890ff",
                          animation: "pulse 2s infinite",
                        }}
                      >
                        ◀ 当前选择
                      </span>
                    )}
                  </h2>

                  <ImageGrid>
                    {monthImages.map((image, index) => (
                      <ImageCard
                        key={index}
                        onClick={() => handleImageClick(image)}
                      >
                        <Popover
                          content={
                            image.notes ? (
                              <div
                                style={{
                                  whiteSpace: "pre-wrap",
                                  maxWidth: "400px",
                                }}
                              >
                                {image.notes}
                              </div>
                            ) : (
                              <div>暂无笔记</div>
                            )
                          }
                          title="图片笔记"
                          trigger="hover"
                          placement="right"
                          open={image.notes ? undefined : false}
                        >
                          <div style={{ height: "200px", overflow: "hidden" }}>
                            {image.dateCreated && (
                              <DateLabel>
                                {new Date(
                                  image.dateCreated
                                ).toLocaleDateString()}
                              </DateLabel>
                            )}
                            <img
                              src={image.url}
                              alt={image.name}
                              loading="lazy"
                              style={{ height: "100%", width: "100%" }}
                            />
                          </div>
                        </Popover>
                        <Popover
                          content={
                            <ImageInfoPopover>
                              <p>
                                <strong>{image.name}</strong>
                              </p>
                              <p>路径：{image.path}</p>
                              <p>类型：{image.type}</p>
                              <p>大小：{image.size}</p>
                              <p>拍摄日期：{image.dateCreated}</p>
                              <p>相机品牌：{image.make}</p>
                              <p>相机型号：{image.model}</p>
                              <p>软件：{image.software}</p>
                              <p>作者：{image.artist}</p>
                            </ImageInfoPopover>
                          }
                          title="图片信息"
                          trigger="hover"
                          placement="right"
                        >
                          <InfoIndicator
                            style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingImage({
                                ...image,
                                dateCreated:
                                  image.dateCreated === "未知"
                                    ? new Date().toLocaleString()
                                    : image.dateCreated,
                                editMode: "properties",
                              });
                            }}
                          >
                            ℹ️
                          </InfoIndicator>
                        </Popover>
                        {image.notes && (
                          <InfoIndicator
                            style={{
                              position: "absolute",
                              top: "8px",
                              right: "36px",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingImage({
                                ...image,
                                editMode: "note",
                              });
                            }}
                          >
                            📝
                          </InfoIndicator>
                        )}
                      </ImageCard>
                    ))}
                  </ImageGrid>
                </MonthGroup>
              ))}

              <Viewer
                visible={visible}
                onChange={handleImageChange}
                onClose={() => setVisible(false)}
                images={viewerImages}
                activeIndex={currentIndex}
                onMaskClick={() => setVisible(false)}
                downloadable={true}
                zoomable={true}
                rotatable={true}
                scalable={true}
                onError={(err) => {
                  console.error("图片加载错误:", err);
                  setVisible(false);
                }}
                noNavbar={false}
                changeable={true}
                showTotal={true}
              />

              {editingImage && (
                <EditDialog
                  image={editingImage}
                  onSave={async (updates) => {
                    await onMetadataUpdate(editingImage.path, updates);
                    setEditingImage(null);
                  }}
                  onClose={() => setEditingImage(null)}
                />
              )}
            </>
          )}

          {isLoading && <Spin tip="正在加载图片信息..." />}

          {error && <Alert message={error} type="error" />}
        </ContentWrapper>
      </ContentContainer>
    </MainContainer>
  );
};

export default ImageManager;
