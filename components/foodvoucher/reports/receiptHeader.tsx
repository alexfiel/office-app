export function reportHeader() {

    return (
        <div className="w-full mb-2 text-center pb-1 border-b-0 border-gray-200">
            <div className="w-full flex justify-center items-center mb-6 min-h-[100px]">
                <div>
                    <img src="/header.png" alt="Logo" style={{ width: '550px', height: '80px' }} />
                </div>
            </div>
            <h1 className="text-2xl font-black tracking-widest text-slate-800 uppercase">FOOD VOUCHER PROGRAM</h1>
            <p className="text-2xl font-black tracking-widest text-slate-800 uppercase">Acknowledgment Receipt</p>

        </div>
    );

}