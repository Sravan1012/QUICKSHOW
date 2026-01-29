import React, { useEffect } from "react";
import AdminNavbar from "../../components/admin/AdminNavbar";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { Outlet } from "react-router-dom";
import { useAppContext } from "../../context/AppContext.jsx";
import Loading from "../../components/Loading.jsx";
const Layout = () => {
  const { isAdmin, loadingAdmin, fetchIsAdmin } = useAppContext();

  useEffect(() => {
    fetchIsAdmin();
  }, []);

  if (loadingAdmin) return <Loading />; // show spinner while fetching

  return isAdmin ? (
    <>
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 px-4 py-10 md:px-10 h-[calc(100vh-64px)] overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </>
  ) : (
    <div className="text-center mt-20 text-xl text-red-500">
      You are not authorized to access this page
    </div>
  );
};

export default Layout;
