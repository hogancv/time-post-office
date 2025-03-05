import React, { useState, useEffect, useMemo } from "react";
import { Typography, Badge } from "antd";
import styled from "styled-components";
import Draggable from "react-draggable";

const { Text } = Typography;

const TimelineContainer = styled.div`
  position: fixed;
  right: 30px;
  top: 25vh;
  width: 150px;
  height: 400px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 100;
  overflow: hidden;
  cursor: move;
`;

const TimelineHeader = styled.div`
  width: 100%;
  text-align: center;
  padding: 0 8px 8px;
  border-bottom: 1px solid #f0f0f0;
  cursor: move;
`;

const TimelineContent = styled.div`
  flex: 1;
  width: 100%;
  overflow-y: auto;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #d9d9d9;
    border-radius: 4px;
  }
`;

const TimeItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
  border-left: 3px solid
    ${(props) => (props.active ? "#1890ff" : "transparent")};
  background-color: ${(props) =>
    props.active ? "rgba(24, 144, 255, 0.1)" : "transparent"};
  color: ${(props) => (props.active ? "#1890ff" : "inherit")};
  font-weight: ${(props) => (props.active ? "600" : "normal")};
  pointer-events: auto;

  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
    color: #1890ff;
  }

  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Count = styled.span`
  font-size: 11px;
  color: #888;
  background: #f0f0f0;
  border-radius: 10px;
  padding: 0 6px;
  min-width: 20px;
  text-align: center;
`;

const ResetButton = styled.div`
  width: 100%;
  padding: 8px 0;
  text-align: center;
  font-size: 12px;
  color: #888;
  border-top: 1px solid #f0f0f0;
  cursor: pointer;

  &:hover {
    color: #1890ff;
    background-color: rgba(0, 0, 0, 0.02);
  }
`;

// 重命名组件为TimelineNav，更准确地反映其功能
const TimelineNav = ({ images, onTimePointChange, sortDirection }) => {
  // 从图片中提取所有年月时间点
  const timePoints = useMemo(() => {
    const yearMonthMap = {};
    let hasUnknown = false;

    // 过滤有笔记的图片并按年月分组
    images.forEach((img) => {
      if (img.notes && img.notes.trim().length > 0) {
        if (img.dateCreated && img.dateCreated !== "未知") {
          try {
            const date = new Date(img.dateCreated);

            // 确保日期有效
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = date.getMonth() + 1;
              const key = `${year}-${month}`;

              if (!yearMonthMap[key]) {
                yearMonthMap[key] = {
                  year,
                  month,
                  date: new Date(date),
                  count: 1,
                  label: `${year}年${month}月`,
                };
              } else {
                yearMonthMap[key].count++;
              }
            } else {
              hasUnknown = true;
            }
          } catch (e) {
            hasUnknown = true;
          }
        } else {
          hasUnknown = true;
        }
      }
    });

    // 转换为数组并按日期排序
    let points = Object.values(yearMonthMap).sort((a, b) => {
      return sortDirection === "asc" ? a.date - b.date : b.date - a.date;
    });

    // 如果有未知日期，添加在最后面
    if (hasUnknown) {
      const unknownCount = images.filter(
        (img) =>
          img.notes &&
          img.notes.trim().length > 0 &&
          (!img.dateCreated ||
            img.dateCreated === "未知" ||
            isNaN(new Date(img.dateCreated).getTime()))
      ).length;

      points.push({
        year: null,
        month: null,
        date: null,
        label: "未知时间",
        isUnknown: true,
        count: unknownCount,
      });
    }

    return points;
  }, [images, sortDirection]);

  // 当前选择的时间点索引
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // 初始化时设置默认选择的时间点
  useEffect(() => {
    if (timePoints.length > 0) {
      // 默认不选择任何时间点
      setSelectedIndex(-1);
    }
  }, [timePoints]);

  // 处理时间点点击
  const handleTimeClick = (index) => {
    // 如果是已选中的，则取消选择
    if (index === selectedIndex) {
      setSelectedIndex(-1);
      if (onTimePointChange) {
        onTimePointChange(null, false);
      }
    } else {
      setSelectedIndex(index);

      const point = timePoints[index];
      if (onTimePointChange) {
        onTimePointChange(point.date, point.isUnknown);
      }
    }
  };

  // 重置选择
  const handleReset = () => {
    setSelectedIndex(-1);
    if (onTimePointChange) {
      onTimePointChange(null, false);
    }
  };

  return (
    <Draggable handle=".timeline-handle" bounds={false}>
      <TimelineContainer>
        <TimelineHeader className="timeline-handle">
          <Text strong>时间导航</Text>
        </TimelineHeader>
        <TimelineContent>
          {timePoints.map((point, index) => (
            <TimeItem
              key={index}
              active={index === selectedIndex}
              onClick={() => handleTimeClick(index)}
            >
              {point.label}
              {point.count > 0 && <Count>{point.count}</Count>}
            </TimeItem>
          ))}

          {timePoints.length === 0 && <TimeItem>暂无时间数据</TimeItem>}
        </TimelineContent>

        {selectedIndex !== -1 && (
          <ResetButton onClick={handleReset}>重置选择</ResetButton>
        )}
      </TimelineContainer>
    </Draggable>
  );
};

export default TimelineNav;
