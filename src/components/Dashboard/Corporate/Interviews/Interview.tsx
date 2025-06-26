import styles from "./interview.module.scss";

const Interview = () => {
  return (
    <div className="flex justify-center items-center h-full flex-col gap-4">
      <div className={`${styles.box} w-[50%] h-[30%] bg-transparent`}>
        <h1 className="tracking-widest font-extrabold text-gray-700 animate-pulse">COMMING SOON</h1>
        <p className="tracking-widest font-thin text-3xl text-gray-700 mt-10">UNDER CONSTRUCTION</p>
      </div>
    </div>
  );
};

export default Interview;
