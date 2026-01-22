export function formatDate(dateString: string): string {
  // 尝试多种方式解析日期
  let date: Date;
  try {
    // 首先尝试直接解析
    date = new Date(dateString);

    // 检查是否为有效日期
    if (isNaN(date.getTime())) {
      // 尝试处理特殊格式
      if (dateString.includes("+")) {
        // 处理带时区的格式
        date = new Date(dateString.replace(/(\+\d{4})/, "UTC$1"));
      } else {
        // 尝试移除特殊字符后解析
        const cleanDate = dateString.replace(/[^\d\s:-]/g, "");
        date = new Date(cleanDate);
      }
    }

    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
  } catch (error) {
    throw new Error(`Unable to parse date: ${dateString}`, { cause: error });
  }

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}
