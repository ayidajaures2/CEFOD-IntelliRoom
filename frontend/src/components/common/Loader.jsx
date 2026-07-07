// components/common/Loader.jsx
function Loader() {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent"></div>
    </div>
  );
}
export default Loader;