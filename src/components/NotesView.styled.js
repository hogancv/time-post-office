import styled from "styled-components";
import Masonry from "react-masonry-css";
import { Title } from "./ImageManager.styled";

export const NotesContainer = styled.div`
  flex: 1;
  margin-left: 200px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative; /* 为时间轴提供定位上下文 */
`;

export const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1400px;
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

// 自定义瀑布流样式
export const StyledMasonry = styled(Masonry)`
  display: flex;
  width: 100%;
  margin-left: -24px; /* 抵消列间距 */

  .masonry-column {
    padding-left: 24px; /* 列间距 */
    background-clip: padding-box;
  }
`;

export const ImageCard = styled.div`
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

  &.highlight-card {
    box-shadow: 0 0 0 3px #1890ff, 0 4px 12px rgba(0, 0, 0, 0.08);
    animation: pulse 2s infinite;
    outline: none; // 移除默认的轮廓
    position: relative;
    z-index: 1; // 确保高亮卡片在正常卡片之上
    // 增加更明显的标记
    &:before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: #1890ff;
      z-index: 2;
    }
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.8),
        0 4px 12px rgba(0, 0, 0, 0.08);
    }
    50% {
      box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.3),
        0 4px 12px rgba(0, 0, 0, 0.08);
    }
    100% {
      box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.8),
        0 4px 12px rgba(0, 0, 0, 0.08);
    }
  }

  img {
    width: 100%;
    height: auto; /* 高度自适应，以适应瀑布流 */
    object-fit: cover;
  }
`;

export const NoteContent = styled.div`
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

export const StyledTitle = styled(Title)`
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

export const EmptyContainer = styled.div`
  padding: 40px;
  text-align: center;
`;

export const DateLabel = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;

  &.unknown-date {
    background-color: rgba(255, 85, 0, 0.7); // 给未知日期一个不同的颜色
  }
`;

export const SortButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
`;
