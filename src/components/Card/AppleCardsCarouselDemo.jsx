"use client";
import Image from "next/image";
import React from "react";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";

export function AppleCardsCarouselDemo({title,data}) {
  const cards = data.map((card, index) => (
    <Card key={card.src} card={card} index={index} layout={true} />
  ));

  return (
    (<div className="w-full h-full ">
      <h2
        className="mx-auto font-sans text-xl text-gray-500 max-w-7xl md:text-5xl">
        {title}
      </h2>
      <Carousel items={cards} />
    </div>)
  );
}




