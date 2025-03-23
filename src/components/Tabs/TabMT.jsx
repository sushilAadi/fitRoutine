import React, { useEffect, useState, useMemo } from "react";
import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
} from "@material-tailwind/react";
import ExerciseCardSelected from "@/app/new/[plan]/ExerciseCardSelected";

 
function TabMT({ tab, selectededDay, setSelectededDay,exercisesBasedOnDay }) {
  const data = tab;
  
  // Use useMemo to calculate the initial tab value
  const initialTab = useMemo(() => {
    console.log("Computing initial tab");
    return data && data.length > 0 ? data[0].value : null;
  }, [data]);
  
  // Set the selected day when the component mounts or data changes
  useEffect(() => {
    console.log("useEffect running");
    if (data?.length > 0 && !selectededDay) {
      console.log("Setting selected day to", initialTab);
      setSelectededDay(initialTab);
    }
  }, [data, initialTab, selectededDay, setSelectededDay]);

  console.log("Current selectededDay:", selectededDay);
  
  // Use a fallback value if selectededDay is null
  const activeTab = selectededDay || initialTab;

  return (
    <Tabs value={activeTab}>
      <div className="headerStyle ">
        <TabsHeader
          className="p-0 bg-transparent bg-white border-b rounded-none border-blue-gray-50 flex-nowrap min-w-max"
          indicatorProps={{
            className:
              "bg-transparent border-b-2 border-gray-900 shadow-none rounded-none",
          }}
        >
          {data?.map(({ label, value }) => (
            <Tab
              key={value}
              value={value}
              onClick={() => setSelectededDay(value)}
              className={`${activeTab === value ? "text-gray-900" : ""} whitespace-nowrap`}
            >
              {label}
            </Tab>
          ))}
        </TabsHeader>
      </div>
      <TabsBody animate={{
          initial: { y: 250 },
          mount: { y: 0 },
          unmount: { y: 250 },
        }}>
        
          <TabPanel key={selectededDay} value={selectededDay} className="p-0 ">
            <ExerciseCardSelected  exercisesBasedOnDay={exercisesBasedOnDay}/>
          </TabPanel>
      </TabsBody>
    </Tabs>
  );
}

export default TabMT;