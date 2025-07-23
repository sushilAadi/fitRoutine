import * as React from "react"
import { useEffect, useRef, useState } from "react"

function FrontBodyPart(props) {
  const svgRef = useRef(null);
  const [selectedPart, setSelectedPart] = useState(null);

  useEffect(() => {
    const addStyleToSvg = () => {
      if (svgRef.current) {
        const svgElements = svgRef.current.getElementsByClassName("hover");

        for (let i = 0; i < svgElements.length; i++) {
          const svgElement = svgElements[i];
          const children = svgElement.children;

          const originalColors = Array.from(children).map(child => child.getAttribute("fill"));

          svgElement.addEventListener("click", function () {
            if (selectedPart === svgElement.id) {
              setSelectedPart(null);
              props.onBodyPartHover("");
              for (let j = 0; j < children.length; j++) {
                const svgItem = children[j];
                svgItem.setAttribute("fill", originalColors[j]);
                svgItem.style.transform = "translate(0px, 0px)";
              }
            } else {
              if (selectedPart) {
                const prevSelected = svgRef.current.getElementById(selectedPart);
                if (prevSelected) {
                  const prevChildren = prevSelected.children;
                  for (let j = 0; j < prevChildren.length; j++) {
                    const svgItem = prevChildren[j];
                    svgItem.setAttribute("fill", originalColors[j]);
                    svgItem.style.transform = "translate(0px, 0px)";
                  }
                }
              }
              setSelectedPart(svgElement.id);
              props.onBodyPartHover(svgElement.id);
              for (let j = 0; j < children.length; j++) {
                const svgItem = children[j];
                svgItem.setAttribute("fill", "green");
                svgItem.style.transform = "translate(4px, -4px)";
              }
            }
          });
        }
      }
    };

    addStyleToSvg();
  }, [props.onBodyPartHover, selectedPart]);

  return (
    <svg
      ref={svgRef}
      width={307}
      height={767}
      viewBox="0 0 307 767"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g filter="url(#filter0_d_1_8)">
        <path
          d="M131.5 104v-9l14.5 9h19l10.5-6.5 5.5-9 2.5 13.5 45 29.5c8.782 3.907 11.78 6.541 16 11.5 4.58 3.934 5.48 4.807 6 5.5 5.073 7.241 6.097 11.44 7 19v48l4.5 46 8.5 25-3 41 3 48.5 21 21.5v7.5l9 8.5c.833 1 3.5 6.5 0 6.5s-6.833.167-9-1.5l-10-13.5c-1.558-.199-.968 50.606-2.5 51-1.532.394-5.175-.109-5-3l-2 9.5s-7.5 2.5-7.5 0V453c-.908 3.407-1.439 5.182-3 4.5-2.058.736-2.952.457-4-1.5l-2.5-19-2.5 10.5H250c-2.5 0-8.5-31-8.5-31V359L226 304l-3.5-67c-3.333 11-10.1 36.8-10.5 52-.4 15.2 2.167 25 3.5 28l13.5 68v56l-3 25.5-16.5 58.5-4.5 36.5-1.5 60-19 75.5-1.5 27.5 7 14.5 14.5 12v7.5h-30l-10-3-9-17.5-1-28 6-14-3-55-3-16.5 1-22 8-38V558l-2-29-1.5-47-2.5-24.5V416l3-18.5h-6L156 424l-5 56-1.5 52-5.5 41 5.5 29.5-2.5 47v42l6.5 22V739l4.5 8.5v11h-37l-2.5-3v-7L124 737v-12.5l-3-28.5-7.5-30.5-14-50v-25l3.5-24V538l-3-29-15-76v-48l6-32v-18l6-21.5V293l2-10.5v-39l-4-6.5-7.5 33-2.5 36-20.5 73.5v39l-7 29-2 2-3-2L54 431h-1.5L49 453l-2 6h-5l-2.5-3v4.5l-2.5 2-3.5-2V453l-2 3H29l-4.5-5 2-46h-2l-2 4.5-9 10.5h-9v-3.5l9-9L19 394l20.5-16.5 2.5-22 1.5-32.5v-42.5l8-24 3.5-39 2-13.5c-1.034-13.341-.772-21.564 0-36.5 1.188-5.537 1.523-8.515 6.5-15.5 3.091-4.231 5.628-6.843 13.5-12.5 5.404-3.722 9.27-5.328 16.5-8l38-27.5z"
          fill="#F2BDBB"
        />
        <path
          d="M238.5 139.5c1.5-1.199 6 3.5 6 3.5m0 0c4.58 3.934 5.48 4.807 6 5.5 5.073 7.241 6.097 11.44 7 19v48l4.5 46 8.5 25-3 41 3 48.5 21 21.5v7.5l9 8.5c.833 1 3.5 6.5 0 6.5s-6.833.167-9-1.5l-10-13.5c-1.558-.199-.968 50.606-2.5 51-1.532.394-5.175-.109-5-3l-2 9.5s-7.5 2.5-7.5 0V453c-.908 3.407-1.439 5.182-3 4.5-2.058.736-2.952.457-4-1.5l-2.5-19-2.5 10.5H250c-2.5 0-8.5-31-8.5-31V359L226 304l-3.5-67c-3.333 11-10.1 36.8-10.5 52-.4 15.2 2.167 25 3.5 28l13.5 68v56l-3 25.5-16.5 58.5-4.5 36.5-1.5 60-19 75.5-1.5 27.5 7 14.5 14.5 12v7.5h-30l-10-3-9-17.5-1-28 6-14-3-55-3-16.5 1-22 8-38V558l-2-29-1.5-47-2.5-24.5V416l3-18.5h-6L156 424l-5 56-1.5 52-5.5 41 5.5 29.5-2.5 47v42l6.5 22V739l4.5 8.5v11h-37l-2.5-3v-7L124 737v-12.5l-3-28.5-7.5-30.5-14-50v-25l3.5-24V538l-3-29-15-76v-48l6-32v-18l6-21.5V293l2-10.5v-39l-4-6.5-7.5 33-2.5 36-20.5 73.5v39l-7 29-2 2-3-2L54 431h-1.5L49 453l-2 6h-5l-2.5-3v4.5l-2.5 2-3.5-2V453l-2 3H29l-4.5-5 2-46h-2l-2 4.5-9 10.5h-9v-3.5l9-9L19 394l20.5-16.5 2.5-22 1.5-32.5v-42.5l8-24 3.5-39 2-13.5c-1.034-13.341-.772-21.564 0-36.5 1.188-5.537 1.523-8.515 6.5-15.5 3.091-4.231 5.628-6.843 13.5-12.5 5.404-3.722 9.27-5.328 16.5-8l38-27.5v-9l14.5 9h19l10.5-6.5 5.5-9 2.5 13.5 45 29.5c8.782 3.907 11.78 6.541 16 11.5z"
          stroke="#000"
        />
        <path
          d="M121 25.5l9-14 9-6S141.5 1 153.5 1s16.767 5.656 22.5 10.5l11.5 14V50l6-4v9l-6 16.5h-5V84L176 97l-10.5 7.5h-19l-13-7.5-8.5-13V71.5h-4L113.5 55l3.5-9 4 4V25.5z"
          fill="#F2BDBB"
          stroke="#000"
        />
        <path
          d="M138.5 116l-5.5-11.5V100h2.5l10.5 4.5h19.5l11-6 3.5-1v7l-3.5 11.5v16.5L158 138l-19.5-5.5V116z"
          fill="#B73131"
          stroke="#000"
          className=""
        />
        <g className="hover" stroke="#000" id="chest">
          <path
            d="M224.042 136c2.213-.215 3.31-.605 3.958-3.765L184.958 104c-2.421-.325-3.281.289-3.958 2.824v23.058c.557 2.956 1.165 4.224 3.958 4.236L224.042 136z"
            fill="url(#paint0_linear_1_8)"
          />
          <path
            d="M96.887 137.787c-3.715-1.245-3.776-2.047-3.62-3.489 13.352-12.202 21.478-18.392 36.451-28.945 1.168.311 1.727.197 3.581 2.579.203.235.517 9.976.973 22.296-.132 1.695-.236 2.644-3.283 4.246l-34.102 3.313z"
            fill="url(#paint1_linear_1_8)"
          />
        </g>
        <g className="hover" fill="#B73131" stroke="#000" id="chest">
          <path d="M158 178l-10.5-29h-21l-20.5 9-7.5 16-2.5 13 10 18.5 14 5h22l8.5-5 7.5-13V178zM164 178l5.5-27 24-2 20.5 9 7.5 16 1.5 12.5-9 19-14 5h-22l-8.5-5-5.5-13V178z" />
        </g>
        <g className="hover" id="abdomen">
          <path
            d="M159.5 217l-3.5-6.5h-16c-3 2.167-10.1 9.3-14.5 20.5s-1.833 12.667 0 12l14.5-8 12-2c3.222-.257 4.888-1.127 7.5-4.5V217z"
            fill="url(#paint2_linear_1_8)"
          />
          <path
            d="M162.5 219c0-7.6 1.333-8.833 2-8.5l22 3 8.5 5.5v28.5h-4l-16.5-9-10-3.5c-.667-2.167-2-8.4-2-16z"
            fill="url(#paint3_linear_1_8)"
          />
          <path
            d="M156 235l3.5 5.5c.359.564.763 1.426 1.067 2.5l1.933-4.5h7.5l23 14c.864 4.983-.713 12.927-2 12.5-.38-.126-9.333-1.833-14-3l-16.433-4.5-1.067-2v-3c-2.8 5.2-17.5 6.833-24.5 7h-11.5c.051-6.831.213-10.266 2-12l12-9c8.191-2.54 12.221-3.302 18.5-3.5z"
            fill="url(#paint4_linear_1_8)"
          />
          <path
            d="M123.5 280v-18H156l2 4.5 1.5 18-5.5 3h-28.5l-2-7.5z"
            fill="url(#paint5_linear_1_8)"
          />
          <path
            d="M160.567 266.5l1.933-4.5 12 3 16.5 5.5V282c0 6-3 7.5-4.5 7.5l-19-2c-4.012-1.637-5.664-3.148-6.933-7.5v-13.5z"
            fill="url(#paint6_linear_1_8)"
          />
          <path
            d="M152 290.5h-25c-1.104 5.332-.219 7.399 1.5 11l4 12.5 11.5 33.5 8 21.5c.989 6.96 1.395 8.688 2 10 6.687 3.474 9.992 2.241 15.752.093L170 379l10.5-24c4.996-14.317 7.428-23.041 10.5-41v-15c-1.049-3.717-1.859-5.43-4.5-6.5l-19-2c-3.494 1.009-5.05 2.061-6.933 5-4.937-4.076-6.63-4.926-8.567-5z"
            fill="url(#paint7_linear_1_8)"
          />
          <path
            d="M201.5 219l17 6-5.5 10h3l2.5 2.5v10L215 264l-3.5 22 2.5 28-15.5 18.5-2.5.5v-36l6-5-4-1.5-1-10.5 3.5-4.5c-.8.8-2-.333-2.5-1l-1-8 2.5-8 5-3-6.5-1.5 1-11 2.5-8c-1.5-1-4.3-3.7-3.5-6.5.8-2.8 1.667-7.833 2-10l1.5.5z"
            fill="url(#paint8_linear_1_8)"
          />
          <path
            d="M103 225c1.2-2.8 7.5-3.5 10.5-3.5h10v7L119 233l1.5 2.5.5 9.5c-.5.5-1.9 1.8-3.5 3v6l1.5 8-5.5 4.5c.833 2.167 2.8 7.2 4 10 1.2 2.8.5 7.167 0 9l-4 4 9 8.5v15c.227 6.053.288 9.447 0 15.5h-5l-20-15.5c-.333-5.333-1-16.3-1-17.5 0-1.2 2-7.833 3-11V242l1-5 5-4-2.5-2c-.5-.833-1.2-3.2 0-6z"
            fill="url(#paint9_linear_1_8)"
          />
          <path
            d="M159.5 252.5c-2.8 5.2-17.5 6.833-24.5 7h-11.5c.051-6.831.213-10.266 2-12l12-9c8.191-2.54 12.221-3.302 18.5-3.5l3.5 5.5c.359.564.763 1.426 1.067 2.5m-1.067 9.5a12.624 12.624 0 001.067-9.5m-1.067 9.5v3l1.067 2L177 262c4.667 1.167 13.62 2.874 14 3 1.287.427 2.864-7.517 2-12.5l-23-14h-7.5l-1.933 4.5M213 235l5.5-10-17-6-1.5-.5c-.333 2.167-1.2 7.2-2 10s2 5.5 3.5 6.5m11.5 0h-11.5m11.5 0h3l2.5 2.5v10m-17-12.5l-2.5 8-1 11 6.5 1.5m14-8l-14 8m14-8L215 264m-10.5-8.5l-5 3-2.5 8 1 8c.5.667 1.7 1.8 2.5 1m0 0c.8-.8 10-8 14.5-11.5m-14.5 11.5L197 280l1 10.5 4 1.5m13-28l-3.5 22m-9.5 6l9.5-6m-9.5 6l-6 5v36l2.5-.5L214 314l-2.5-28m-106-53l-2.5-2c-.5-.833-1.2-3.2 0-6s7.5-3.5 10.5-3.5h10v7L119 233m-13.5 0H119m-13.5 0l-5 4-1 5m19.5-9l1.5 2.5.5 9.5c-.5.5-1.9 1.8-3.5 3m-18-6l8.5 3c2.5 1.5 7.9 4.2 9.5 3m-18-6v7m18-1v6l1.5 8-5.5 4.5m0 0c-2.667-.5-8.5-2.6-10.5-7s-3.167-8.833-3.5-10.5m14 17.5c.833 2.167 2.8 7.2 4 10 1.2 2.8.5 7.167 0 9l-4 4m-14-40.5v25.5m14 15c-1.333-.5-5-2.5-9-6.5s-5-7.333-5-8.5m14 15l9 8.5v15c.227 6.053.288 9.447 0 15.5h-5l-20-15.5c-.333-5.333-1-16.3-1-17.5 0-1.2 2-7.833 3-11v-10m56.5-64l3.5 6.5v11.5c-2.612 3.373-4.278 4.243-7.5 4.5l-12 2-14.5 8c-1.833.667-4.4-.8 0-12s11.5-18.333 14.5-20.5h16zm8.5 0c-.667-.333-2 .9-2 8.5s1.333 13.833 2 16l10 3.5 16.5 9h4V219l-8.5-5.5-22-3zm-41 51.5v18l2 7.5H154l5.5-3-1.5-18-2-4.5h-32.5zm39 0l-1.933 4.5V280c1.269 4.352 2.921 5.863 6.933 7.5l19 2c1.5 0 4.5-1.5 4.5-7.5v-11.5l-16.5-5.5-12-3zM127 290.5h25c1.937.074 3.63.924 8.567 5 1.883-2.939 3.439-3.991 6.933-5l19 2c2.641 1.07 3.451 2.783 4.5 6.5v15c-3.072 17.959-5.504 26.683-10.5 41L170 379c-5.914 2.205-9.217 3.524-16 0-.605-1.312-1.011-3.04-2-10l-8-21.5-11.5-33.5-4-12.5c-1.719-3.601-2.604-5.668-1.5-11z"
            stroke="#000"
          />
        </g>
        <g className="hover">
          <path
            d="M99.5 160.5V144c-10.689-1.618-17.043-1.106-29 2.5-8.284 6.649-10.393 11.533-12.5 21V202c-.081 6.019.447 7.079 2 6.5 2.594.359 3.846-.835 6-3.5 7.336-1.595 12.996-4.373 14-7 2.427-6.352 9.833-10.333 11-13.5V173c0-6 5.667-10.833 8.5-12.5z"
            fill="url(#paint10_linear_1_8)"
          />
          <path
            d="M80 202c3.05-6.684 5.47-8.775 10-12 2.96-1.631 3.192 3.545 2.5 17.5l1 28.5c.177.399-13.347 22.724-13.5 23-.153.276-3.614 8.903-6 12H61.5l-7-12v-18c1.234-8.526 1.893-13.538 3.5-19.5.919-8.03 4.615-9.58 10.5-13L80 202z"
            fill="url(#paint11_linear_1_8)"
          />
          <path
            d="M58 283.5L52.5 271c-1.744-2.214-2.803-2.594-5 0l-4 11.5 1 21L43 350c-.284 5.077-.396 7.923 0 13l4.5 4c3.324 2.267 5.249 3.359 10.5 0l8-4 2-13 15.5-46.5V289c-.984-2.285-1.99-3.543-9.5-5.5H58z"
            fill="url(#paint12_linear_1_8)"
          />
          <path
            d="M220 164.5l-2-20.5v-2.5h21l10.5 9 6 14v49l-2.5 12-23.5-36-4-9.5-5.5-15.5z"
            fill="url(#paint13_linear_1_8)"
          />
          <path
            d="M253 233.5c-2.5-2-13.094-22.893-25.5-39-2.14-1.294-2.963-1.104-3.5 1.5-.5 6.667-.9 24.9 1.5 44.5s5 27.5 6 29h7.5c4.123 2.32 11.633 3.349 14 3 2.881-.424 5.5-1.667 6.5-3-.167-2.333-.4-9.4 0-19s-4-15-6.5-17z"
            fill="url(#paint14_linear_1_8)"
          />
          <path
            d="M264 276h-6.5c-8.667-.5-26.4-1.9-28-3.5-1.6-1.6-3 1.667-3.5 3.5l1.5 27 4 15 11.5 41 5.5 12.5h9l6.5-3.5 1.5-10.5V329l3.5-40.5-5-12.5z"
            fill="url(#paint15_linear_1_8)"
          />
          <path
            d="M99.5 160.5V144c-10.689-1.618-17.043-1.106-29 2.5-8.284 6.649-10.393 11.533-12.5 21V202c-.081 6.019.447 7.079 2 6.5 2.594.359 3.846-.835 6-3.5 7.336-1.595 12.996-4.373 14-7 2.427-6.352 9.833-10.333 11-13.5V173c0-6 5.667-10.833 8.5-12.5z"
            stroke="#000"
          />
          <path
            d="M80 202c3.05-6.684 5.47-8.775 10-12 2.96-1.631 3.192 3.545 2.5 17.5l1 28.5c.177.399-13.347 22.724-13.5 23-.153.276-3.614 8.903-6 12H61.5l-7-12v-18c1.234-8.526 1.893-13.538 3.5-19.5.919-8.03 4.615-9.58 10.5-13L80 202zM58 283.5L52.5 271c-1.744-2.214-2.803-2.594-5 0l-4 11.5 1 21L43 350c-.284 5.077-.396 7.923 0 13l4.5 4c3.324 2.267 5.249 3.359 10.5 0l8-4 2-13 15.5-46.5V289c-.984-2.285-1.99-3.543-9.5-5.5H58zM220 164.5l-2-20.5v-2.5h21l10.5 9 6 14v49l-2.5 12-23.5-36-4-9.5-5.5-15.5zM253 233.5c-2.5-2-13.094-22.893-25.5-39-2.14-1.294-2.963-1.104-3.5 1.5-.5 6.667-.9 24.9 1.5 44.5s5 27.5 6 29h7.5c4.123 2.32 11.633 3.349 14 3 2.881-.424 5.5-1.667 6.5-3-.167-2.333-.4-9.4 0-19s-4-15-6.5-17zM264 276h-6.5c-8.667-.5-26.4-1.9-28-3.5-1.6-1.6-3 1.667-3.5 3.5l1.5 27 4 15 11.5 41 5.5 12.5h9l6.5-3.5 1.5-10.5V329l3.5-40.5-5-12.5z"
            stroke="#000"
          />
        </g>
        <g className="hover">
          <path
            d="M138.5 368.5c-10.463-18.94-15.457-30.293-37.5-39.5-9.428 15.671-9.42 34.309-14 59-.901 21.439-.044 32.496 2.5 51.5l15 75.5 13.5 13 22 4.5 7.5-2V473l3-36.5c1.167-9.833 2.8-32.8 0-46-2.8-13.2-9.167-20.167-12-22z"
            fill="url(#paint16_linear_1_8)"
          />
          <path
            d="M171 388c14.544-29.489 23.69-43.611 43-61.5 7.144 18.019 8.484 36.337 12.5 64l-3 64.5-15 66.5c-.667 3.667-4.9 11.5-16.5 13.5s-13.833.833-13.5 0L164 521.5l-3-64v-44c2.451-11.633 4.041-17.905 10-25.5z"
            fill="url(#paint17_linear_1_8)"
          />
          <path
            d="M118 573l-9.5-4h-4l-3 21v27l19.5 68.5 6 11 18-3.5v-61l2.5-29.5-5-26c-.833-2.5-3.4-6.7-7-3.5s-13.167 1.333-17.5 0z"
            fill="url(#paint18_linear_1_8)"
          />
          <path
            d="M184.5 576.5l-17-7.5-3.5 10.5-5.5 26.5v26l2.5 53.5 6.5 7.5h17l7.5-32.5 9.5-36v-48c-.333-1.167-2.7-2.8-9.5 0s-7.5 0-7.5 0z"
            fill="url(#paint19_linear_1_8)"
          />
          <path
            d="M138.5 368.5c-10.463-18.94-15.457-30.293-37.5-39.5-9.428 15.671-9.42 34.309-14 59-.901 21.439-.044 32.496 2.5 51.5l15 75.5 13.5 13 22 4.5 7.5-2V473l3-36.5c1.167-9.833 2.8-32.8 0-46-2.8-13.2-9.167-20.167-12-22zM171 388c14.544-29.489 23.69-43.611 43-61.5 7.144 18.019 8.484 36.337 12.5 64l-3 64.5-15 66.5c-.667 3.667-4.9 11.5-16.5 13.5s-13.833.833-13.5 0L164 521.5l-3-64v-44c2.451-11.633 4.041-17.905 10-25.5zM118 573l-9.5-4h-4l-3 21v27l19.5 68.5 6 11 18-3.5v-61l2.5-29.5-5-26c-.833-2.5-3.4-6.7-7-3.5s-13.167 1.333-17.5 0zM184.5 576.5l-17-7.5-3.5 10.5-5.5 26.5v26l2.5 53.5 6.5 7.5h17l7.5-32.5 9.5-36v-48c-.333-1.167-2.7-2.8-9.5 0s-7.5 0-7.5 0z"
            stroke="#000"
          />
        </g>
      </g>
      <defs>
        <filter
          id="filter0_d_1_8"
          x={0}
          y={0.5}
          width={306.758}
          height={766.5}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={4} />
          <feGaussianBlur stdDeviation={2} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_1_8" />
          <feBlend
            in="SourceGraphic"
            in2="effect1_dropShadow_1_8"
            result="shape"
          />
        </filter>
        <linearGradient
          id="paint0_linear_1_8"
          x1={203.636}
          y1={126.155}
          x2={206.203}
          y2={175.071}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#D9D9D9" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint1_linear_1_8"
          x1={114.338}
          y1={127.511}
          x2={113.68}
          y2={174.783}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#D9D9D9" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint2_linear_1_8"
          x1={165}
          y1={220.5}
          x2={151}
          y2={557.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#D9D9D9" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint3_linear_1_8"
          x1={165}
          y1={220.5}
          x2={151}
          y2={557.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#D9D9D9" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint4_linear_1_8"
          x1={165}
          y1={220.5}
          x2={151}
          y2={557.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#D9D9D9" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint5_linear_1_8"
          x1={165}
          y1={220.5}
          x2={151}
          y2={557.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#D9D9D9" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint6_linear_1_8"
          x1={165}
          y1={220.5}
          x2={151}
          y2={557.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#D9D9D9" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint7_linear_1_8"
          x1={165}
          y1={220.5}
          x2={151}
          y2={557.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#D9D9D9" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint8_linear_1_8"
          x1={165}
          y1={220.5}
          x2={151}
          y2={557.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#D9D9D9" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint9_linear_1_8"
          x1={165}
          y1={220.5}
          x2={151}
          y2={557.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#D9D9D9" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint10_linear_1_8"
          x1={155.872}
          y1={141.5}
          x2={145.5}
          y2={622.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#B73131" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint11_linear_1_8"
          x1={155.872}
          y1={141.5}
          x2={145.5}
          y2={622.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#B73131" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint12_linear_1_8"
          x1={155.872}
          y1={141.5}
          x2={145.5}
          y2={622.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#B73131" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint13_linear_1_8"
          x1={155.872}
          y1={141.5}
          x2={145.5}
          y2={622.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#B73131" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint14_linear_1_8"
          x1={155.872}
          y1={141.5}
          x2={145.5}
          y2={622.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#B73131" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint15_linear_1_8"
          x1={155.872}
          y1={141.5}
          x2={145.5}
          y2={622.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#B73131" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint16_linear_1_8"
          x1={156.576}
          y1={326.5}
          x2={153}
          y2={1169.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#B73131" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint17_linear_1_8"
          x1={156.576}
          y1={326.5}
          x2={153}
          y2={1169.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#B73131" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint18_linear_1_8"
          x1={156.576}
          y1={326.5}
          x2={153}
          y2={1169.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#B73131" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint19_linear_1_8"
          x1={156.576}
          y1={326.5}
          x2={153}
          y2={1169.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B73131" />
          <stop offset={1} stopColor="#B73131" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default FrontBodyPart
