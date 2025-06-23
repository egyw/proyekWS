const calculateRemainingTime = (futureTimestamp) => {
  const now = new Date();
  const future = new Date(futureTimestamp);
  const diffMs = future - now;

  if (diffMs <= 0) {
    return "0 detik";
  }

  const diffSecs = Math.ceil(diffMs / 1000);
  const minutes = Math.floor(diffSecs / 60);
  const seconds = diffSecs % 60;

  if (minutes > 0) {
    return `${minutes} menit ${seconds} detik`;
  }
  return `${seconds} detik`;
};

module.exports = { calculateRemainingTime };