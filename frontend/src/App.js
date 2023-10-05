import "./App.css";
import Header from "./component/Header";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { setDataProduct } from "./redux/productSlide";
import { useDispatch, useSelector } from "react-redux";

function App() {
  const dispatch = useDispatch();
  const productData = useSelector((state) => state.product);
  // const backend_url =
  //   process.env.REACT_APP_SERVER_DOMIN || "http://localhost:8000";
  const backend_url = "http://localhost:8000";
  useEffect(() => {
    (async () => {
      try {
        console.log("helo");
        const res = await fetch(`${backend_url}/product`);
        console.log(process.env.REACT_APP_SERVER_DOMIN);
        const resData = await res.json();
        console.log("resdata", resData);
        dispatch(setDataProduct(resData));
      } catch (error) {
        console.log(`Failed to load the data from database:${error}`);
      }
    })();
  });

  return (
    <>
      <Toaster />
      <div>
        <Header />
        <main className="pt-16 bg-slate-100 min-h-[calc(100vh)]">
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default App;
