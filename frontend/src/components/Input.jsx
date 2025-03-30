const Input = ({icon:Icon,...props}) => {
    return (
        <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Icon className="size-5 text-purple-600"/>
            </div>
            <input
                {...props}
                className="w-full pl-10 pr-3 py-2 bg-white bg-opacity-50 rounded-2xl border border-gray-700
                focus:border-purple-600 focus:ring-2 focus:ring-purple-200 text-black placeholder-gray-600 transition
                duration-200"
            />
        </div>
    )
}

export default Input;