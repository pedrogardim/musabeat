export const detectTouchOut = (e) => {
  let target = e.target.getBoundingClientRect();
  let touch = e.touches[0];
  let isInside =
    touch.clientX > target.left &&
    touch.clientX < target.right &&
    touch.clientY > target.top &&
    touch.clientY < target.bottom;
  return !isInside;
};
