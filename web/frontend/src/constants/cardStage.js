export function createDefaultCardStage() {
  return {
    status: 'in_progress',
    subPhase: 'select', // 'select' | 'draw'
    local: {
      played: [],
    },
    remote: {
      drawn: [],
      activeDrawId: null,
    },
  };
}

