import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE_URL from "../../utils/config";
import "./FarmDetail.css";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import {
  FaCamera,
  FaEdit,
  FaTrash,
  FaUpload,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";
import { GrFormPrevious } from "react-icons/gr";
import { AnimatePresence, motion } from "framer-motion";

function FarmDetail() {
  const { farmId } = useParams();
  const [farm, setFarm] = useState(null);
  const [greenhouses, setGreenhouses] = useState([]);
  const [selectedGh, setSelectedGh] = useState(null);
  const [gridData, setGridData] = useState(null);
  const [numRows, setNumRows] = useState(0);
  const [numCols, setNumCols] = useState(0);
  const [weather, setWeather] = useState(null);
  const [twoDay, setTwoDay] = useState([]);
  const [sensor, setSensor] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState("");
  const [groups, setGroups] = useState(null);
  const [groupAxis, setGroupAxis] = useState(null);
  const [showIotModal, setShowIotModal] = useState(false);
  const [iotList, setIotList] = useState([]);
  const [selectedIot, setSelectedIot] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editGrid, setEditGrid] = useState(null);
  const [grid, setGrid] = useState(Array(10).fill(Array(10).fill(0)));
  const [selectedBar, setSelectedBar] = useState(null);
  const [barDetailDirection, setBarDetailDirection] = useState("in");
  const [barDetailIndex, setBarDetailIndex] = useState(null);
  const [showCaptureAreaCard, setShowCaptureAreaCard] = useState(false);
  const [selectedCaptureBar, setSelectedCaptureBar] = useState(null);
  const [selectedCaptureIot, setSelectedCaptureIot] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [sensorLoading, setSensorLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedUploadBar, setSelectedUploadBar] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // selectedBar가 변경될 때 이미지 인덱스 리셋
  useEffect(() => {
    if (selectedBar) {
      setCurrentImageIndex(0);
    }
  }, [selectedBar]);

  const mergedBarContainerRef = useRef(null);

  // 길이 포맷팅 함수 (cell 한 칸 = 10cm)
  const formatLength = (cellCount) => {
    if (!cellCount || cellCount === 0) return "-";
    const totalCm = cellCount * 10; // 한 칸당 10cm
    if (totalCm >= 100) {
      const meters = totalCm / 100;
      return `${meters.toFixed(1)}m`;
    } else {
      return `${totalCm}cm`;
    }
  };

  // 그리드 타입 매핑
  const gridTypeMapping = {
    0: { label: "길", color: "#F9F7E8" },
    1: { label: "딸기", color: "#FF8B8B" },
    2: { label: "토마토", color: "#61BFAD" },
  };

  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/farms/${farmId}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("농장 정보를 불러오는데 실패했습니다.");
        return res.json();
      })
      .then((data) => setFarm(data))
      .catch((err) => setError(err.message));
  }, [farmId]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/greenhouses/list/${farmId}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("온실 목록을 불러오는데 실패했습니다.");
        return res.json();
      })
      .then((data) => {
        const greenhousesData =
          data && data.greenhouses ? data.greenhouses : [];
        setGreenhouses(greenhousesData);
        if (greenhousesData.length > 0) setSelectedGh(greenhousesData[0]);
      })
      .catch((err) => {
        setError(err.message);
        setGreenhouses([]);
      });
  }, [farmId]);

  useEffect(() => {
    if (!farm || !farm.location) return;
    fetch(
      `${API_BASE_URL}/api/weather?city=${encodeURIComponent(farm.location)}`,
      {
        credentials: "include",
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("날씨 정보를 불러오는데 실패했습니다.");
        return res.json();
      })
      .then((data) => {
        setWeather(data.weather);
        setTwoDay(data.two_day || []);
      })
      .catch((err) => setError(err.message));
  }, [farm]);

  useEffect(() => {
    if (!selectedGh) return;
    fetch(`${API_BASE_URL}/api/greenhouses/api/grid?id=${selectedGh.id}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok)
          throw new Error("그리드 데이터를 불러오는데 실패했습니다.");
        return res.json();
      })
      .then((data) => {
        let grid = data.grid_data;
        if (typeof grid === "string") {
          try {
            grid = JSON.parse(grid);
          } catch {}
        }
        setGridData(grid);
        setNumRows(data.num_rows);
        setNumCols(data.num_cols);
      })
      .catch((err) => setError(err.message));

    fetch(`${API_BASE_URL}/api/greenhouses/${selectedGh.id}/groups`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("그룹 정보를 불러오는데 실패했습니다.");
        return res.json();
      })
      .then((data) => {
        // 그룹을 안정적으로 정렬하여 위치가 변하지 않도록 함
        // group_cells의 첫 번째 셀 기준으로 정렬 (행 우선, 열 우선)
        const sortedGroups = [...data.groups].sort((a, b) => {
          const aCells = a.group_cells || [];
          const bCells = b.group_cells || [];
          if (aCells.length === 0 && bCells.length === 0) return 0;
          if (aCells.length === 0) return 1;
          if (bCells.length === 0) return -1;

          const aFirst = aCells[0];
          const bFirst = bCells[0];

          // 행 기준 정렬, 같으면 열 기준
          if (aFirst[0] !== bFirst[0]) {
            return aFirst[0] - bFirst[0];
          }
          return aFirst[1] - bFirst[1];
        });

        setGroups(sortedGroups);
        setGroupAxis(data.axis);

        // selectedBar가 있으면 업데이트된 그룹 정보로 동기화
        if (selectedBar && selectedBar.group) {
          const updatedGroup = sortedGroups.find(
            (g) => g.id === selectedBar.group.id
          );
          if (updatedGroup) {
            setSelectedBar({
              ...selectedBar,
              group: updatedGroup,
            });
          }
        }
      })
      .catch((err) => setError(err.message));
  }, [selectedGh]);

  useEffect(() => {
    if (mergedBarContainerRef.current && groups && groups.length > 0) {
      const container = mergedBarContainerRef.current;
      // requestAnimationFrame으로 스크롤 최적화
      requestAnimationFrame(() => {
        container.scrollTop =
          (container.scrollHeight - container.clientHeight) / 2;
        container.scrollLeft =
          (container.scrollWidth - container.clientWidth) / 2;
      });
    }
  }, [groups, groupAxis]);

  useEffect(() => {
    if (!selectedGh) return;
    setSensorLoading(true);
    fetch(`${API_BASE_URL}/api/sensor/latest?gh_id=${selectedGh.id}`)
      .then((res) => res.json())
      .then((data) => {
        setSensorData(data);
        setSensorLoading(false);
      })
      .catch(() => {
        setSensorData(null);
        setSensorLoading(false);
      });
  }, [selectedGh]);

  const handleSidebarToggle = () => setSidebarOpen((open) => !open);
  const handleAddGreenhouse = () => navigate(`/greenhouse-grid/${farmId}`);

  const handleCapture = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/product/api/iot/list`, {
        credentials: "include",
      });
      const data = await response.json();
      if (!data.iot_list || data.iot_list.length === 0) {
        alert("IoT를 구독해주세요.");
        return;
      }
      setIotList(data.iot_list);
      setShowIotModal(true);
    } catch (err) {
      setError("IoT 목록을 불러오는데 실패했습니다.");
      console.error("IoT 목록 조회 오류:", err);
    }
  };

  const handleEdit = () => {
    if (!selectedGh) return;
    console.log("수정할 grid_data:", gridData);
    navigate(`/greenhouse-grid/${farmId}?edit=${selectedGh.id}`, {
      state: {
        greenhouseId: selectedGh.id,
        gridData,
        numRows,
        numCols,
        houseName: selectedGh.name,
      },
    });
  };

  const handleGridCellChange = (row, col, value) => {
    const newGrid = editGrid.map((arr) => arr.slice());
    newGrid[row][col] = value;
    setEditGrid(newGrid);
  };

  const handleSaveGrid = async () => {
    if (!selectedGh) return;
    try {
      await fetch(`${API_BASE_URL}/api/greenhouses/update/${selectedGh.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: selectedGh.name,
          num_rows: numRows,
          num_cols: numCols,
          grid_data: editGrid,
        }),
      });
      setIsEditMode(false);
      setGridData(editGrid);
    } catch (err) {
      setError("그리드 저장에 실패했습니다.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditGrid(null);
  };

  const handleDelete = async () => {
    if (!selectedGh || !window.confirm("정말로 이 하우스를 삭제하시겠습니까?"))
      return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/greenhouses/${selectedGh.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("하우스 삭제에 실패했습니다.");
      const updatedGreenhouses = greenhouses.filter(
        (gh) => gh.id !== selectedGh.id
      );
      setGreenhouses(updatedGreenhouses);
      if (updatedGreenhouses.length > 0) {
        setSelectedGh(updatedGreenhouses[0]);
      } else {
        setSelectedGh(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleIotSelect = (iot) => {
    setSelectedIot(iot);
  };

  const handleIotConfirm = () => {
    setShowIotModal(false);
    setShowCaptureAreaCard(true);
    setSelectedCaptureIot(selectedIot);
  };

  const handleCaptureCancel = () => {
    setShowCaptureAreaCard(false);
    setSelectedCaptureBar(null);
    setSelectedCaptureIot(null);
  };

  const handleCaptureBarClick = (group) => {
    if (group.crop_type === 0) return; // 길은 선택 불가
    if (selectedCaptureBar && selectedCaptureBar.id === group.id) {
      setSelectedCaptureBar(null); // 이미 선택된 바를 다시 클릭하면 해제
    } else {
      setSelectedCaptureBar(group);
    }
  };

  const handleCaptureConfirm = async () => {
    if (!selectedCaptureBar || !selectedCaptureIot) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/greenhouses/crop_groups/read`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            group_id: selectedCaptureBar?.id,
            iot_id: selectedCaptureIot?.id,
          }),
        }
      );

      const result = await response.json();

      setShowCaptureAreaCard(false);
      setSelectedCaptureBar(null);
      setSelectedCaptureIot(null);

      if (response.ok) {
        alert("IoT 촬영 명령이 전송되었습니다. 잠시 후 결과가 업데이트됩니다.");

        // 5초 후 그룹 데이터를 다시 가져와서 분석 결과 반영
        setTimeout(async () => {
          if (selectedGh) {
            try {
              const groupsResponse = await fetch(
                `${API_BASE_URL}/api/greenhouses/${selectedGh.id}/groups`,
                {
                  credentials: "include",
                }
              );
              if (groupsResponse.ok) {
                const groupsData = await groupsResponse.json();

                // 그룹을 안정적으로 정렬하여 위치가 변하지 않도록 함
                const sortedGroups = [...groupsData.groups].sort((a, b) => {
                  const aCells = a.group_cells || [];
                  const bCells = b.group_cells || [];
                  if (aCells.length === 0 && bCells.length === 0) return 0;
                  if (aCells.length === 0) return 1;
                  if (bCells.length === 0) return -1;

                  const aFirst = aCells[0];
                  const bFirst = bCells[0];

                  // 행 기준 정렬, 같으면 열 기준
                  if (aFirst[0] !== bFirst[0]) {
                    return aFirst[0] - bFirst[0];
                  }
                  return aFirst[1] - bFirst[1];
                });

                setGroups(sortedGroups);
                setGroupAxis(groupsData.axis);

                // 촬영한 그룹의 업데이트된 정보로 selectedBar 업데이트
                if (selectedCaptureBar) {
                  const updatedGroup = sortedGroups.find(
                    (g) => g.id === selectedCaptureBar.id
                  );
                  if (updatedGroup) {
                    if (
                      selectedBar &&
                      selectedBar.group.id === selectedCaptureBar.id
                    ) {
                      setSelectedBar({
                        ...selectedBar,
                        group: updatedGroup,
                      });
                    }
                  }
                }
              }

              // 센서 데이터 갱신
              const sensorResponse = await fetch(
                `${API_BASE_URL}/api/sensor/latest?gh_id=${selectedGh.id}`
              );
              if (sensorResponse.ok) {
                const sensorData = await sensorResponse.json();
                setSensorData(sensorData);
              }
            } catch (err) {
              console.error("데이터 갱신 실패:", err);
            }
          }
        }, 5000);
      } else {
        alert("촬영 명령 전송 실패: " + result.message);
      }
    } catch (err) {
      setError("IoT 촬영 명령 전송에 실패했습니다.");
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  // 이미지 업로드 관련 핸들러들
  const handleUpload = () => {
    setShowUploadModal(true);
  };

  const handleUploadCancel = () => {
    setShowUploadModal(false);
    setSelectedUploadBar(null);
    setSelectedFiles([]);
    setUploadResult(null);
  };

  const handleUploadConfirmClose = () => {
    setShowUploadModal(false);
    setSelectedUploadBar(null);
    setSelectedFiles([]);
    setUploadResult(null);
  };

  const handleUploadBarClick = (group) => {
    if (group.crop_type === 0) return; // 길은 선택 불가
    if (selectedUploadBar && selectedUploadBar.id === group.id) {
      setSelectedUploadBar(null);
    } else {
      setSelectedUploadBar(group);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleUploadConfirm = async () => {
    if (!selectedUploadBar || selectedFiles.length === 0) {
      alert("영역을 선택하고 이미지를 업로드해주세요.");
      return;
    }

    setIsUploading(true);
    const uploadedGroupId = selectedUploadBar.id; // 업로드한 그룹 ID 저장

    try {
      const formData = new FormData();
      formData.append("group_id", selectedUploadBar.id);

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch(
        `${API_BASE_URL}/api/greenhouses/crop_groups/upload_analyze`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const result = await response.json();

      if (response.ok) {
        setUploadResult(result);
        alert("이미지 분석이 완료되었습니다!");

        // 그룹 데이터를 다시 가져와서 바로 반영
        if (selectedGh) {
          const groupsResponse = await fetch(
            `${API_BASE_URL}/api/greenhouses/${selectedGh.id}/groups`,
            {
              credentials: "include",
            }
          );
          if (groupsResponse.ok) {
            const groupsData = await groupsResponse.json();

            // 그룹을 안정적으로 정렬하여 위치가 변하지 않도록 함
            const sortedGroups = [...groupsData.groups].sort((a, b) => {
              const aCells = a.group_cells || [];
              const bCells = b.group_cells || [];
              if (aCells.length === 0 && bCells.length === 0) return 0;
              if (aCells.length === 0) return 1;
              if (bCells.length === 0) return -1;

              const aFirst = aCells[0];
              const bFirst = bCells[0];

              // 행 기준 정렬, 같으면 열 기준
              if (aFirst[0] !== bFirst[0]) {
                return aFirst[0] - bFirst[0];
              }
              return aFirst[1] - bFirst[1];
            });

            setGroups(sortedGroups);
            setGroupAxis(groupsData.axis);

            // 업로드한 그룹의 업데이트된 정보로 selectedBar 업데이트
            const updatedGroup = sortedGroups.find(
              (g) => g.id === uploadedGroupId
            );
            if (updatedGroup) {
              // selectedBar가 있으면 업데이트, 없으면 새로 생성
              if (selectedBar && selectedBar.group.id === uploadedGroupId) {
                setSelectedBar({
                  ...selectedBar,
                  group: updatedGroup,
                });
              } else {
                // selectedBar가 없거나 다른 그룹이 선택되어 있으면 업로드한 그룹 선택
                setSelectedBar({
                  group: updatedGroup,
                  axis: updatedGroup.is_horizontal ? "row" : "col",
                });
              }
            }
          }
        }

        // 모달은 확인 버튼을 누를 때까지 유지
      } else {
        alert("분석 실패: " + result.message);
      }
    } catch (error) {
      alert("업로드 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  function weatherIcon(description) {
    if (!description) return "🌤️";
    const desc = description.toLowerCase();
    if (desc.includes("비")) return "🌧️";
    if (desc.includes("눈")) return "❄️";
    if (desc.includes("구름")) return "☁️";
    if (desc.includes("맑")) return "☀️";
    if (desc.includes("흐림")) return "🌥️";
    if (desc.includes("번개")) return "⛈️";
    if (desc.includes("안개")) return "🌫️";
  }

  const renderMergedBars = () => {
    if (!groups) return null;
    const isRow = groupAxis === "row";
    return (
      <div
        className="merged-bar-container"
        ref={mergedBarContainerRef}
        style={{
          display: "flex",
          flexDirection: isRow ? "column" : "row",
          gap: "16px",
          alignItems: isRow ? "flex-start" : "flex-start",
          justifyContent: isRow ? "flex-start" : "flex-start",
          width: "100%",
          height: "auto",
          overflow: "auto",
          position: "relative",
          margin: 0,
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        {groups.map((group) => {
          const { group_cells, crop_type, is_horizontal, id } = group;
          if (!group_cells || group_cells.length === 0) return null;
          const style = is_horizontal
            ? {
                width: `${group_cells.length * 45}px`,
                height: "45px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }
            : {
                width: "45px",
                height: `${group_cells.length * 45}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                flexShrink: 0,
              };
          // selectedBar와 비교하여 선택된 바 표시
          const isSelected = selectedBar && selectedBar.group.id === id;
          return (
            <div
              key={id} // idx 대신 id를 key로 사용하여 안정성 확보
              className={`merged-bar type-${crop_type} ${
                isSelected ? "capture-bar-selected" : ""
              }`}
              style={style}
              onClick={() =>
                setSelectedBar({ group, axis: is_horizontal ? "row" : "col" })
              }
            >
              <span
                className={is_horizontal ? undefined : "vertical-text"}
                style={{ fontWeight: 700 }}
              >
                {gridTypeMapping[crop_type]?.label || crop_type}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCaptureAreaCard = () => {
    if (!groups) return null;
    const isRow = groupAxis === "row";
    return (
      <div className="modal-overlay">
        <motion.div
          key="capture-area"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", bounce: 0.3, duration: 0.7 }}
          className="capture-area-card upload-modal"
        >
          <div className="upload-modal-header">
            <h2>촬영할 영역을 선택하세요</h2>
            <div className="upload-modal-actions">
              <button
                className="upload-header-btn close"
                onClick={handleCaptureCancel}
                aria-label="닫기"
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>
          <div className="upload-modal-content">
            <div className="capture-area-wrapper">
              <div
                className="merged-bar-container"
                style={{
                  display: "flex",
                  flexDirection: isRow ? "column" : "row",
                  gap: "16px",
                  alignItems: isRow ? "flex-start" : "flex-start",
                  justifyContent: isRow ? "flex-start" : "flex-start",
                  minHeight: "200px",
                  minWidth: "300px",
                  position: "relative",
                }}
              >
                {groups.map((group, idx) => {
                  const { group_cells, crop_type, is_horizontal, id } = group;
                  if (!group_cells || group_cells.length === 0) return null;
                  const isSelected =
                    selectedCaptureBar && selectedCaptureBar.id === id;
                  const isDisabled = crop_type === 0;
                  const style = is_horizontal
                    ? {
                        width: `${group_cells.length * 45}px`,
                        height: "45px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }
                    : {
                        width: "45px",
                        height: `${group_cells.length * 45}px`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                      };
                  return (
                    <div
                      key={id || idx}
                      className={`merged-bar type-${crop_type} ${
                        isSelected ? "capture-bar-selected" : ""
                      } ${isDisabled ? "capture-bar-disabled" : ""}`}
                      style={style}
                      onClick={() => !isDisabled && handleCaptureBarClick(group)}
                    >
                      <span
                        className={is_horizontal ? undefined : "vertical-text"}
                        style={{ fontWeight: 700 }}
                      >
                        {gridTypeMapping[crop_type]?.label || crop_type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="upload-modal-footer">
            <div className="capture-footer-buttons">
              <button
                className="control-btn delete"
                onClick={handleCaptureCancel}
              >
                취소
              </button>
              <button
                className="control-btn capture"
                onClick={handleCaptureConfirm}
                disabled={!selectedCaptureBar}
              >
                확인
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="farmdetail-container">
      <aside className={`farmdetail-sidebar${sidebarOpen ? "" : " closed"}`}>
        <div className="farmdetail-sidebar-header">
          <h3
            className={`farmdetail-sidebar-title${
              sidebarOpen ? "" : " hidden"
            }`}
          >
            비닐하우스 목록
          </h3>
          <button
            className="farmdetail-sidebar-toggle"
            onClick={handleSidebarToggle}
            aria-label={sidebarOpen ? "사이드바 접기" : "사이드바 펴기"}
          >
            {sidebarOpen ? (
              <GoSidebarExpand size={30} />
            ) : (
              <GoSidebarCollapse size={30} />
            )}
          </button>
        </div>
        {sidebarOpen && (
          <>
            {greenhouses.length === 0 ? (
              <p className="farmdetail-empty">등록된 비닐하우스가 없습니다.</p>
            ) : (
              <>
                <ul className="farmdetail-list">
                  {greenhouses.map((gh) => (
                    <li
                      key={gh.id}
                      onClick={() => {
                        setSelectedGh(gh);
                        setSelectedBar(null);
                        setBarDetailDirection("in");
                      }}
                      style={{
                        background:
                          selectedGh && selectedGh.id === gh.id
                            ? "#e6f2d6"
                            : undefined,
                      }}
                    >
                      {gh.name}
                    </li>
                  ))}
                </ul>
                <button
                  className="farmdetail-add-btn"
                  onClick={handleAddGreenhouse}
                >
                  + 비닐하우스 추가
                </button>
              </>
            )}
          </>
        )}
      </aside>
      <main className="farmdetail-main">
        {greenhouses.length === 0 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <button
              className="farmdetail-empty-btn"
              onClick={handleAddGreenhouse}
            >
              + 비닐하우스 추가
            </button>
          </div>
        ) : (
          <>
            <div className="farm-info-card-col">
              {farm && (
                <div className="farm-info-card">
                  <div className="farm-info-header">
                    <h2>{farm.name}농장</h2>
                    <div className="location">위치: {farm.location}</div>
                  </div>
                  <div className="farm-info-content">
                    <h3 className="grid-title">{selectedGh?.name} 하우스</h3>
                    {isEditMode ? (
                      <div className="grid-container">
                        {editGrid &&
                          editGrid.map((row, rowIdx) => (
                            <div key={rowIdx} style={{ display: "flex" }}>
                              {row.map((cell, colIdx) => (
                                <input
                                  key={colIdx}
                                  type="number"
                                  value={cell}
                                  min={0}
                                  max={2}
                                  style={{
                                    width: 40,
                                    height: 40,
                                    textAlign: "center",
                                    margin: 2,
                                    borderRadius: 6,
                                    border: "1px solid #ccc",
                                  }}
                                  onChange={(e) =>
                                    handleGridCellChange(
                                      rowIdx,
                                      colIdx,
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              ))}
                            </div>
                          ))}
                        <div
                          style={{ marginTop: 16, display: "flex", gap: 12 }}
                        >
                          <button
                            className="control-btn edit"
                            onClick={handleSaveGrid}
                          >
                            저장
                          </button>
                          <button
                            className="control-btn delete"
                            onClick={handleCancelEdit}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      groups && renderMergedBars()
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="weather-card-col">
              <AnimatePresence initial={false} custom={barDetailDirection}>
                {!selectedBar && weather ? (
                  <motion.div
                    key="weather"
                    initial={{
                      opacity: 0,
                      x: barDetailDirection === -1 ? 80 : -80,
                    }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{
                      opacity: 0,
                      x: barDetailDirection === -1 ? -80 : 80,
                    }}
                    transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
                    className="weather-card"
                    style={{ position: "absolute", width: "100%" }}
                  >
                    <div className="weather-header">
                      <h3 className="weather-title">오늘의 날씨</h3>
                      <select
                        className="city-select"
                        value={farm?.location || ""}
                        disabled
                      >
                        <option>{farm?.location || ""}</option>
                      </select>
                    </div>
                    <div className="weather-today">
                      <div className="weather-icon">
                        {weatherIcon(weather.description)}
                      </div>
                      <div className="weather-info">
                        <div className="weather-temp">
                          {weather.temperature}°C
                        </div>
                        <div className="weather-desc">
                          {weather.description}
                        </div>
                      </div>
                    </div>
                    <div className="weather-forecast-title">내일/모레 예보</div>
                    <div className="weather-forecast-row">
                      {twoDay &&
                      twoDay.length > 0 &&
                      twoDay.some((day) => day.min_temp !== "-") ? (
                        twoDay.map((day) => (
                          <div className="forecast-card" key={day.date}>
                            <div className="forecast-date">{day.date}</div>
                            <div className="forecast-temp">
                              {day.min_temp !== "-"
                                ? `${day.min_temp}°C ~ ${day.max_temp}°C`
                                : "예보 없음"}
                            </div>
                            <div className="forecast-desc">
                              {day.description} {weatherIcon(day.description)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="forecast-card">내일 예보 없음</div>
                          <div className="forecast-card">모레 예보 없음</div>
                        </>
                      )}
                    </div>
                    <hr className="weather-divider" />
                    <div className="env-card">
                      <div className="env-title">하우스 환경</div>
                      {sensorLoading ? (
                        <div>로딩 중...</div>
                      ) : sensorData && !sensorData.message ? (
                        <>
                          <div className="env-info-row">
                            <span className="env-label">온도</span>
                            <span className="env-value">
                              {sensorData.temperature}°C
                            </span>
                          </div>
                          <div className="env-info-row">
                            <span className="env-label">습도</span>
                            <span className="env-value">
                              {sensorData.humidity}%
                            </span>
                          </div>
                          <div className="env-info-row">
                            <span className="env-label">측정 시간</span>
                            <span className="env-value">
                              {new Date(sensorData.timestamp).toLocaleString(
                                "ko-KR",
                                {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div style={{ color: "#ff4d4d", fontWeight: 600 }}>
                          {sensorData?.message ||
                            "온습도를 측정하기 위해 IoT를 작동시키세요."}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : null}
                {selectedBar && selectedBar.group && (
                  <motion.div
                    key="bar-detail"
                    initial={false}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{
                      opacity: 0,
                      x: barDetailDirection === -1 ? 80 : -80,
                    }}
                    transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
                    className="bar-detail-card"
                    style={{ position: "absolute", width: "100%" }}
                  >
                    <div
                      className="bar-detail-back"
                      onClick={() => {
                        setBarDetailDirection(-1);
                        setSelectedBar(null);
                      }}
                    >
                      <GrFormPrevious size={30} />
                    </div>
                    <div className="bar-detail-content">
                      <h2>
                        {selectedBar.axis === "row"
                          ? `${
                              selectedBar.group.group_cells?.[0]?.[0] + 1 || "-"
                            }행 상세 정보`
                          : `${
                              selectedBar.group.group_cells?.[0]?.[1] + 1 || "-"
                            }열 상세 정보`}
                      </h2>

                      {/* 기본 정보 카드 */}
                      <div className="bar-info-card">
                        <div className="bar-info-grid">
                          <div className="bar-info-item">
                            <div className="bar-info-label">작물 타입</div>
                            <div
                              className={`bar-info-value crop-type ${
                                selectedBar.group.crop_type === 0
                                  ? "crop-type-path"
                                  : ""
                              }`}
                              style={
                                selectedBar.group.crop_type !== 0
                                  ? {
                                      color:
                                        gridTypeMapping[
                                          selectedBar.group.crop_type
                                        ]?.color || "#333",
                                    }
                                  : {}
                              }
                            >
                              {gridTypeMapping[selectedBar.group.crop_type]
                                ?.label || selectedBar.group.crop_type}
                            </div>
                          </div>
                          <div className="bar-info-item">
                            <div className="bar-info-label">
                              {selectedBar.axis === "row"
                                ? "행 번호"
                                : "열 번호"}
                            </div>
                            <div className="bar-info-value">
                              {selectedBar.axis === "row"
                                ? selectedBar.group.group_cells?.[0]?.[0] + 1 ||
                                  "-"
                                : selectedBar.group.group_cells?.[0]?.[1] + 1 ||
                                  "-"}
                            </div>
                          </div>
                        </div>

                        <div className="bar-info-full">
                          <div className="bar-info-label">길이</div>
                          <div className="bar-info-value">
                            {formatLength(
                              selectedBar.group.group_cells?.length
                            )}
                          </div>
                        </div>

                        <div className="bar-info-grid">
                          <div className="bar-info-item">
                            <div className="bar-info-label">수확 가능</div>
                            <div className="bar-info-value bar-harvest-value">
                              {selectedBar.group.harvest_amount ?? "-"}
                              <span className="bar-info-unit">개</span>
                            </div>
                          </div>
                          <div className="bar-info-item">
                            <div className="bar-info-label">총 작물</div>
                            <div className="bar-info-value">
                              {selectedBar.group.total_amount ?? "-"}
                              <span className="bar-info-unit">개</span>
                            </div>
                          </div>
                        </div>

                        {/* 분석 결과 항목 추가 */}
                        {selectedBar.group.last_analysis_result && (
                          <>
                            <div className="bar-info-grid">
                              <div className="bar-info-item bar-analysis-item-unripe">
                                <div className="bar-info-label">
                                  안익은 딸기
                                </div>
                                <div className="bar-info-value bar-unripe-value">
                                  {selectedBar.group.last_analysis_result
                                    .unripe ||
                                    selectedBar.group.last_analysis_result
                                      .total_unripe ||
                                    0}
                                  <span className="bar-info-unit">개</span>
                                </div>
                              </div>
                              <div
                                className={`bar-info-item ${
                                  selectedBar.group.last_analysis_result
                                    .has_rotten ||
                                  (selectedBar.group.last_analysis_result
                                    .rotten &&
                                    selectedBar.group.last_analysis_result.rotten.includes(
                                      "발견"
                                    ))
                                    ? "bar-rotten-item-has"
                                    : "bar-rotten-item-no"
                                }`}
                              >
                                <div className="bar-info-label">썩은 딸기</div>
                                <div
                                  className={`bar-info-value ${
                                    selectedBar.group.last_analysis_result
                                      .has_rotten ||
                                    (selectedBar.group.last_analysis_result
                                      .rotten &&
                                      selectedBar.group.last_analysis_result.rotten.includes(
                                        "발견"
                                      ))
                                      ? "bar-rotten-value-has"
                                      : "bar-rotten-value-no"
                                  }`}
                                >
                                  {selectedBar.group.last_analysis_result
                                    .has_rotten ||
                                  (selectedBar.group.last_analysis_result
                                    .rotten &&
                                    selectedBar.group.last_analysis_result.rotten.includes(
                                      "발견"
                                    ))
                                    ? "발견됨"
                                    : "없음"}
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {typeof selectedBar.group.harvest_amount === "number" &&
                          typeof selectedBar.group.total_amount === "number" &&
                          selectedBar.group.total_amount > 0 && (
                            <div className="bar-harvest-ratio">
                              <div className="bar-harvest-ratio-label">
                                수확 가능 비율
                              </div>
                              <div className="bar-harvest-ratio-value">
                                {Math.round(
                                  (selectedBar.group.harvest_amount /
                                    selectedBar.group.total_amount) *
                                    100
                                )}
                                %
                              </div>
                            </div>
                          )}
                      </div>

                      {/* 촬영 이미지 갤러리 */}
                      {selectedBar.group.last_analysis_result &&
                        selectedBar.group.last_analysis_result.analyzed_files &&
                        selectedBar.group.last_analysis_result.analyzed_files
                          .length > 0 && (
                          <div className="bar-image-section">
                            <h4 className="bar-image-title">촬영 이미지</h4>
                            <div className="bar-image-gallery">
                              <button
                                className="bar-image-nav-btn bar-image-nav-left"
                                onClick={() =>
                                  setCurrentImageIndex((prev) =>
                                    prev > 0
                                      ? prev - 1
                                      : selectedBar.group.last_analysis_result
                                          .analyzed_files.length - 1
                                  )
                                }
                                disabled={
                                  selectedBar.group.last_analysis_result
                                    .analyzed_files.length <= 1
                                }
                              >
                                <FaChevronLeft size={18} />
                              </button>
                              <div className="bar-image-container">
                                <img
                                  src={`${API_BASE_URL}/static/uploads/crop_images/${
                                    selectedBar.group.last_analysis_result
                                      .analyzed_files[currentImageIndex]
                                      ?.filename ||
                                    selectedBar.group.last_image_path
                                  }`}
                                  alt={`분석 이미지 ${currentImageIndex + 1}`}
                                  loading="lazy"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                                {selectedBar.group.last_analysis_result
                                  .analyzed_files.length > 1 && (
                                  <div className="bar-image-counter">
                                    {currentImageIndex + 1} /{" "}
                                    {
                                      selectedBar.group.last_analysis_result
                                        .analyzed_files.length
                                    }
                                  </div>
                                )}
                              </div>
                              <button
                                className="bar-image-nav-btn bar-image-nav-right"
                                onClick={() =>
                                  setCurrentImageIndex((prev) =>
                                    prev <
                                    selectedBar.group.last_analysis_result
                                      .analyzed_files.length -
                                      1
                                      ? prev + 1
                                      : 0
                                  )
                                }
                                disabled={
                                  selectedBar.group.last_analysis_result
                                    .analyzed_files.length <= 1
                                }
                              >
                                <FaChevronRight size={18} />
                              </button>
                            </div>
                          </div>
                        )}
                      {/* 단일 이미지인 경우 (analyzed_files가 없는 경우) */}
                      {selectedBar.group.last_image_path &&
                        (!selectedBar.group.last_analysis_result ||
                          !selectedBar.group.last_analysis_result
                            .analyzed_files ||
                          selectedBar.group.last_analysis_result.analyzed_files
                            .length === 0) && (
                          <div className="bar-image-section">
                            <h4 className="bar-image-title">촬영 이미지</h4>
                            <div className="bar-image-container">
                              <img
                                src={`${API_BASE_URL}/static/uploads/crop_images/${selectedBar.group.last_image_path}`}
                                alt="분석 이미지"
                                loading="lazy"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            </div>
                          </div>
                        )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="control-card-col">
              {selectedGh && (
                <div className="control-card">
                  <button
                    className="control-btn capture"
                    onClick={handleCapture}
                  >
                    <FaCamera /> 촬영
                  </button>
                  <button className="control-btn upload" onClick={handleUpload}>
                    <FaUpload /> 이미지 업로드
                  </button>
                  <button className="control-btn edit" onClick={handleEdit}>
                    <FaEdit /> 수정
                  </button>
                  <button className="control-btn delete" onClick={handleDelete}>
                    <FaTrash /> 삭제
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {showIotModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">IoT 할당</h2>
            </div>
            <div className="iot-list">
              {iotList.map((iot) => (
                <div
                  key={iot.id}
                  className={`iot-item ${
                    selectedIot?.id === iot.id ? "selected" : ""
                  }`}
                  onClick={() => handleIotSelect(iot)}
                >
                  <div>
                    <div className="iot-item-name">{iot.name}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn cancel"
                onClick={() => setShowIotModal(false)}
              >
                취소
              </button>
              <button
                className="modal-btn confirm"
                onClick={handleIotConfirm}
                disabled={!selectedIot}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCaptureAreaCard && renderCaptureAreaCard()}
      </AnimatePresence>

      <AnimatePresence>
        {showUploadModal && (
          <div className="modal-overlay">
            <motion.div
              key="upload-area"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.7 }}
              className="capture-area-card upload-modal"
            >
              <div className="upload-modal-header">
                <h2>업로드할 영역을 선택하세요</h2>
                <div className="upload-modal-actions">
                  {!uploadResult && (
                    <button
                      className="upload-header-btn analyze"
                      onClick={handleUploadConfirm}
                      disabled={
                        !selectedUploadBar ||
                        selectedFiles.length === 0 ||
                        isUploading
                      }
                    >
                      {isUploading ? "분석 중..." : "분석"}
                    </button>
                  )}
                  <button
                    className="upload-header-btn close"
                    onClick={handleUploadCancel}
                    aria-label="닫기"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>
              </div>

              <div className="upload-modal-content">
                <div
                  style={{
                    width: 700,
                    maxWidth: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 20,
                  }}
                >
                  {/* 영역 선택 */}
                  <div
                    className="merged-bar-container"
                    style={{
                      display: "flex",
                      flexDirection: groupAxis === "row" ? "column" : "row",
                      gap: "16px",
                      alignItems:
                        groupAxis === "row" ? "flex-start" : "flex-start",
                      justifyContent:
                        groupAxis === "row" ? "flex-start" : "flex-start",
                      minHeight: "200px",
                      minWidth: "300px",
                      position: "relative",
                    }}
                  >
                    {groups &&
                      groups.map((group, idx) => {
                        const { group_cells, crop_type, is_horizontal, id } =
                          group;
                        if (!group_cells || group_cells.length === 0)
                          return null;
                        const isSelected =
                          selectedUploadBar && selectedUploadBar.id === id;
                        const isDisabled = crop_type === 0;
                        const style = is_horizontal
                          ? {
                              width: `${group_cells.length * 45}px`,
                              height: "45px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }
                          : {
                              width: "45px",
                              height: `${group_cells.length * 45}px`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexDirection: "column",
                            };
                        return (
                          <div
                            key={id || idx}
                            className={`merged-bar type-${crop_type} ${
                              isSelected ? "capture-bar-selected" : ""
                            } ${isDisabled ? "capture-bar-disabled" : ""}`}
                            style={style}
                            onClick={() =>
                              !isDisabled && handleUploadBarClick(group)
                            }
                          >
                            <span
                              className={
                                is_horizontal ? undefined : "vertical-text"
                              }
                              style={{ fontWeight: 700 }}
                            >
                              {gridTypeMapping[crop_type]?.label || crop_type}
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  {/* 파일 선택 */}
                  {selectedUploadBar && (
                    <div className="upload-file-section">
                      <h3 className="upload-file-title">
                        이미지 파일들을 선택하세요
                      </h3>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                        className="upload-file-input"
                      />
                      {selectedFiles.length > 0 && (
                        <p className="upload-file-count">
                          {selectedFiles.length}개 파일 선택됨
                        </p>
                      )}
                    </div>
                  )}

                  {/* 분석 결과 */}
                  {uploadResult && (
                    <div className="upload-analysis-result">
                      <div className="upload-analysis-title">분석 결과</div>
                      <div className="upload-analysis-grid">
                        <div className="upload-analysis-item">
                          <div className="upload-analysis-item-label">
                            총 파일
                          </div>
                          <div className="upload-analysis-item-value">
                            {uploadResult.result.total_files}
                            <span className="upload-analysis-unit">개</span>
                          </div>
                        </div>
                        <div className="upload-analysis-item">
                          <div className="upload-analysis-item-label">
                            전체 딸기
                          </div>
                          <div className="upload-analysis-item-value">
                            {uploadResult.result.total_count}
                            <span className="upload-analysis-unit">개</span>
                          </div>
                        </div>
                      </div>
                      <div className="upload-analysis-grid">
                        <div className="upload-analysis-item ripe">
                          <div className="upload-analysis-item-label">
                            익은 딸기
                          </div>
                          <div className="upload-analysis-item-value">
                            {uploadResult.result.total_ripe}
                            <span className="upload-analysis-unit">개</span>
                          </div>
                        </div>
                        <div className="upload-analysis-item unripe">
                          <div className="upload-analysis-item-label">
                            안익은 딸기
                          </div>
                          <div className="upload-analysis-item-value">
                            {uploadResult.result.total_unripe}
                            <span className="upload-analysis-unit">개</span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`upload-rotten-status ${
                          uploadResult.result.has_rotten.includes("발견")
                            ? "has-rotten"
                            : "no-rotten"
                        }`}
                      >
                        <div className="upload-rotten-label">
                          썩은 딸기 상태
                        </div>
                        <div className="upload-rotten-value">
                          {uploadResult.result.has_rotten.includes("발견")
                            ? "발견됨"
                            : "없음"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 헤더에 분석/닫기 버튼이 배치되어 하단 푸터는 제거 */}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FarmDetail;
