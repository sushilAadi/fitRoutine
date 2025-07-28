import React from 'react'
import ButtonCs from './ButtonCs'

const FooterButton = ({backClick,btnClick,btnTitle,btnType="button",disabled}) => {
    return (
        <div className="border-t-2 px-4 w-100 py-4 flex gap-x-8 justify-center items-center ">
            <div className="flex gap-x-4 justify-center items-center">
                <i className="fa-solid fa-arrow-left-long text-gray-400 cursor-pointer" onClick={backClick}></i>
                <div className="h-6 w-[1px] bg-gray-400"></div>
            </div>
            <ButtonCs
                disabled={disabled}
                onClick={btnClick}
                title={btnTitle}
                icon={<i className="ml-2 fa-solid fa-arrow-right "></i>}
                type={btnType}
                className="btnStyle min-w-[184px] "
            />
        </div>
    )
}

export default FooterButton