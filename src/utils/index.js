export const handleDate=(data)=>{
    const dateArray = new Date(data)
    ?.toDateString()
    ?.split(" ");
  const date = `${dateArray[2]} ${dateArray[1]} ${dateArray[3]}`;
  return date;
  }