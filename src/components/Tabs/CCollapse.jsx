import React from "react";
import { Collapse } from "@material-tailwind/react";

const CCollapse = ({ open, data = [], onClick }) => {

  return (
    <Collapse open={open}>
      <div>
        {data?.map((item) => (
          <p key={item} className="mb-2 text-sm text-gray-600">- {item}</p>
        ))}
      </div>
    </Collapse>
  );
};

// Memoizing the component for performance optimization
export default React.memo(CCollapse);
