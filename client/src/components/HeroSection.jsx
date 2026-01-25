import { ArrowRight, CalendarIcon, ClockIcon } from "lucide-react";
import React from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-start justify-center gap-r px-6 md:px-16 lg:px-36 bg-[url('/avatar.jpg')] bg-cover bg-center h-screen">
      <div className="mt-32 max-w-xl rounded-2xl bg-black/40  p-6">
        <div className="w-full flex justify-center mt-20">
          <img
            src={assets.avatarLogo}
            alt="avatarLogo"
            className="h-24 md:h-28 lg:h-32"
          />
        </div>

        <h1 className="text-5xl md:text-[70px] md:leading-18 font-semibold max-w-110">
          Avatar <br />
          Fire and Ash
        </h1>

        <div className="flex items-center gap-4 text-gray-300">
          <span>Action | Adventure | Sci-Fi</span>
          <div>
            <CalendarIcon className="w-4.5 h-4.5" /> 2025
          </div>
          <div>
            <ClockIcon className="w-4.5 h-4.5" /> 3h 17m
          </div>
        </div>
        <p className="max-w-md text-gray-300">
          Jake and Neytiri's family grapples with grief, encountering a new,
          aggressive Na'vi tribe, the Ash People, who are led by the fiery
          Varang, as the conflict on Pandora escalates and a new moral focus
          emerges.
        </p>
        <button
          onClick={() => navigate("/movies")}
          className="flex items-center gap-1 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
        >
          Explore Movies
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default HeroSection;
