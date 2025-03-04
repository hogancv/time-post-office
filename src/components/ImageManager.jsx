import React, { useState, useRef, useMemo, useEffect } from "react";

import Viewer from "react-viewer";

import exifr from "exifr";

import {
  ImageGrid,
  ImageCard,
  Stats,
  Loading,
  ErrorMessage,
  FilterBar,
  Select,
  Button,
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
} from "./ImageManager.styled";

import { imageDB } from "../utils/imageDB";
import EditDialog from "./EditDialog";
import ContextMenu from "./ContextMenu";
import { Popover } from "antd";
import NotesView from './NotesView';

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

  const [visible, setVisible] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);

  const [viewerImages, setViewerImages] = useState([]);

  const [editingImage, setEditingImage] = useState(null);

  const [contextMenu, setContextMenu] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // 获取所有不重复的相机型号

  const uniqueModels = useMemo(() => {
    const models = new Set(images.map((img) => img.model));

    const modelArray = Array.from(models);

    // 确保未知型号总是在列表最后

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

    // 排序逻辑保持不变
    const sorted = [...filtered].sort((a, b) => {
      if (a.dateCreated === "未知" && b.dateCreated === "未知") return 0;
      if (a.dateCreated === "未知") return 1;
      if (b.dateCreated === "未知") return -1;
      const dateA = new Date(a.dateCreated);
      const dateB = new Date(b.dateCreated);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    // 分组逻辑保持不变
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

    // 月份排序逻辑保持不变
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

            // 获取存储的元数据
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
  };

  // 处理图片点击

  const handleImageClick = (monthKey, index) => {
    // 准备查看器需要的图片数据
    const allImages = [];

    Object.values(groupedImages).forEach((monthImages) => {
      monthImages.forEach((image) => {
        allImages.push({
          src: image.url,
          alt: image.name || "",
          title: image.name || "",
          description: `拍摄时间：${image.dateCreated}\n相机型号：${image.model}`,
        });
      });
    });

    // 计算在所有图片中的索引
    let globalIndex = 0;
    for (const [key, images] of Object.entries(groupedImages)) {
      if (key === monthKey) {
        globalIndex += index;
        break;
      }
      globalIndex += images.length;
    }

    setViewerImages(allImages);
    setActiveIndex(globalIndex);
    setVisible(true);
  };

  // 处理元数据更新
  const handleMetadataUpdate = async (imagePath, updates) => {
    await onMetadataUpdate(imagePath, updates);
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

  // 处理右键点击
  const handleContextMenu = (e, image) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
    });
    // 如果拍摄时间是"未知"，设置为当前时间
    const imageWithDefaultDate = {
      ...image,
      dateCreated:
        image.dateCreated === "未知"
          ? new Date().toLocaleString()
          : image.dateCreated,
    };
    setSelectedImage(imageWithDefaultDate);
  };

  return (
    <MainContainer>
      <ContentContainer>
        <Title>图片管理器</Title>
        <ContentWrapper>
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
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  <option value="all">所有相机型号</option>

                  {uniqueModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </Select>

                <Select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="desc">时间降序</option>

                  <option value="asc">时间升序</option>
                </Select>

                <Button onClick={handleReset}>重新选择文件夹</Button>

                <Button onClick={handleExportConfig}>导出配置</Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportConfig}
                  style={{ display: "none" }}
                  id="config-import"
                />
                <Button
                  onClick={() =>
                    document.getElementById("config-import").click()
                  }
                >
                  导入配置
                </Button>
              </FilterBar>

              <Stats>
                <p>共找到 {images.length} 张图片</p>
              </Stats>

              {Object.entries(groupedImages).map(([monthKey, monthImages]) => (
                <MonthGroup key={monthKey}>
                  <h2>{monthKey}</h2>

                  <ImageGrid>
                    {monthImages.map((image, index) => (
                      <ImageCard
                        key={index}
                        onClick={() => handleImageClick(monthKey, index)}
                        onContextMenu={(e) => handleContextMenu(e, image)}
                      >
                        <Popover
                          content={image.notes}
                          title="图片笔记"
                          trigger="hover"
                          placement="right"
                          open={image.notes ? undefined : false}
                        >
                          <img
                            src={image.url}
                            alt={image.name}
                            loading="lazy"
                          />
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
                                dateCreated: image.dateCreated === "未知" ? new Date().toLocaleString() : image.dateCreated,
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
                onClose={() => setVisible(false)}
                images={viewerImages}
                activeIndex={activeIndex}
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
                    await handleMetadataUpdate(editingImage.path, updates);
                    setEditingImage(null);
                  }}
                  onClose={() => setEditingImage(null)}
                />
              )}

              {contextMenu && (
                <ContextMenu
                  x={contextMenu.x}
                  y={contextMenu.y}
                  onClose={() => {
                    setContextMenu(null);
                    setSelectedImage(null);
                  }}
                  onNoteClick={() => {
                    setContextMenu(null);
                    setEditingImage({
                      ...selectedImage,
                      editMode: "note",
                    });
                  }}
                  onPropertiesClick={() => {
                    setContextMenu(null);
                    setEditingImage({
                      ...selectedImage,
                      editMode: "properties",
                    });
                  }}
                />
              )}

              <NotesView images={images} />
            </>
          )}

          {isLoading && (
            <Loading>
              <div className="loading-spinner"></div>
              <p>正在加载图片信息...</p>
            </Loading>
          )}

          {error && <ErrorMessage>{error}</ErrorMessage>}
        </ContentWrapper>
      </ContentContainer>
    </MainContainer>
  );
};

export default ImageManager;
