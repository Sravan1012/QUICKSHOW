const BlurCircle = ({
  top = "auto",
  left = "auto",
  right = "auto",
  bottom = "auto",
  size = "16rem",
  color = "bg-primary/30",
}) => {
  return (
    <div
      className={`absolute -z-50 rounded-full blur-3xl ${color}`}
      style={{
        top,
        left,
        right,
        bottom,
        width: size,
        height: size,
      }}
    ></div>
  );
};

export default BlurCircle;
