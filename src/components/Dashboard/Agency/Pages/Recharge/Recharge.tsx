import { Info, Square, TrendingUp } from 'lucide-react'
import React, { useState } from 'react'

const Recharge = () => {
  const [selectedCV, setSelectedCV] = useState<number>(1000);
  const rechargeList = [200,300,400,500,700,1000,1200,1500,2000,3000,5000,10000]
  const dummyTransaction = [
  {
    "id": "ad001",
    "amount": 200,
    "cv": 2000,
    "date": "19-20-2023"
  },
  {
    "id": "ad002",
    "amount": 250,
    "cv": 2100,
    "date": "20-20-2023"
  },
  {
    "id": "ad003",
    "amount": 300,
    "cv": 2200,
    "date": "21-20-2023"
  },
  {
    "id": "ad004",
    "amount": 150,
    "cv": 1800,
    "date": "22-20-2023"
  },
  {
    "id": "ad005",
    "amount": 400,
    "cv": 2500,
    "date": "23-20-2023"
  },
  {
    "id": "ad006",
    "amount": 350,
    "cv": 2300,
    "date": "24-20-2023"
  },
  {
    "id": "ad007",
    "amount": 100,
    "cv": 1700,
    "date": "25-20-2023"
  },
  {
    "id": "ad008",
    "amount": 220,
    "cv": 2050,
    "date": "26-20-2023"
  },
  {
    "id": "ad009",
    "amount": 280,
    "cv": 2150,
    "date": "27-20-2023"
  },
  {
    "id": "ad010",
    "amount": 320,
    "cv": 2250,
    "date": "28-20-2023"
  }
]

  return (
    <div className='flex flex-col lg:flex-row justify-center items-center gap-5 m-5'>
      {/* recharge section left side */}
      <div className='flex-1 min-h-[30em] w-full rounded-xl shadow-xl border-1 border-gray-300 bg-white'>
        <h1 className='text-2xl font-semibold p-8'>Recharge your wallet now</h1>

      <div className="max-w-lg w-full mx-auto">
        <p className='text-left text-xs flex flex-row justify-start items-center gap-2 px-6'>
          Choose cv package 
          <span className='text-gray-400'>
            <Info className='h-3 w-auto'/>
          </span>
        </p>

        <div className='flex justify-center items-center text-center flex-wrap gap-2 mt-6 px-6'>
          {rechargeList.map((cv, index) => {
          const isSelected = selectedCV === cv;

          return (
            <div key={index} className='flex justify-start'>
              <span
                onClick={() => setSelectedCV(cv)}
                className={`cursor-pointer border border-gray-500 max-w-[3em] min-w-[3em] max-h-[4em] min-h-[4em] rounded-lg px-[3rem] py-3 flex justify-center items-center text-xs font-semibold text-nowrap
                  ${isSelected ? 'bg-blue-100 text-blue-600 border-blue-700' : null}
                `}
              >
                {cv} CV
              </span>
            </div>
          );
        })}
        </div>
      </div>
      
          <div className='flex flex-row gap-3 justify-center items-center mt-4 px-8'>
                <div className='text-left flex-1'>
                    <label htmlFor="rate" className="inline-flex items-center gap-1">
                      Rate <span className="text-gray-400"><Info className='h-3 w-auto'/></span>
                    </label>
                    <input 
                      id="total"
                      type="text"
                      className="input_primary auth_input bg-gray-200 text-black h-10"
                      disabled={true}
                      value={"15₹ / CV"}
                    />
                </div>
                <div className='text-left flex-2'>
                    <label htmlFor="total" className="inline-flex items-center gap-1">
                      Total <span className="text-gray-400"><Info className='h-3 w-auto'/></span>
                    </label>
                    <input 
                      id="total"
                      type="text"
                      className="input_primary auth_input bg-gray-200 text-black h-10"
                      disabled={true}
                      value={selectedCV !== null ? `₹${selectedCV * 15}` : '₹0'}
                    />                 
                </div>
          </div>

          <div>
            <button className='bg-gradient-to-t from-blue-500 to-cyan-300 px-6 py-2 rounded-xl mt-6 mb-2 shadow-xl text-white font-semibold text-sm'>Purchase</button>
          </div>
      </div>


      {/* transaction section right side */}
      <div className='flex-1 min-h-[30em] w-full flex flex-col gap-3 rounded-xl'>
        <div className='flex flex-row justify-end items-center'>
          <div
            className="rounded-xl w-full p-[3px] sm:w-1/2"
            style={{
              background: 'linear-gradient(to bottom, blue, cyan)',
            }}
          >
            <div className='rounded-lg p-3 bg-blue-800 flex flex-row gap-5 justify-around items-center'>
              <div className="text-white">
                Balance
              </div>
              <div className='text-nowrap bg-white rounded-lg px-4 font-semibold text-blue-500'>
                885 cv
              </div>
            </div>
          </div>
        </div>

    <div className='flex-1 rounded-xl flex flex-col justify-between shadow-xl bg-white'>
      {/* Header */}
    <div className='flex flex-col px-4 pt-2 space-y-1'>
      {/* Top row */}
      <div className='flex justify-between items-center'>
        <div className='flex flex-row justify-center items-center gap-2'>
          <span className='bg-cyan-300 text-cyan-300 text-lg rounded-[50%] h-2 w-2 border-cyan-100'></span>
          <span className='font-semibold text-sm'>Payment Transactions</span>
        </div>
        <span className='text-gray-400 text-2xl'>...</span>
      </div>

      {/* Second row */}
      <div className='flex justify-start items-center gap-2 pt-2'>
        <span className='font-semibold text-sm'>₹2,19,321</span>
        <span className='text-gray-400'>|</span>
        <select className='text-sm border rounded px-2 py-1'>
          <option>This month</option>
        </select>
      </div>
    </div>


      {/* Scrollable middle section */}
      <div className='middle overflow-y-auto max-h-[15em] px-4 py-2 space-y-2'>
        {dummyTransaction.map((tx, index) => (
          <div
            key={index}
            className='border rounded-md p-3 flex justify-between items-center text-sm shadow-lg'
          >
            <div className='flex flex-row text-start gap-2 justify-center items-center'>
              <div className='border rounded-[50%] bg-blue-100'>
                <Square className='w-5 h-auto m-2 text-blue-300'/>
              </div>             
              <div className='flex flex-col'>
                <span className='font-medium'>{tx.cv} CV</span>
                <span className='text-xs text-gray-500'>Added {tx.cv} cv in wallet</span>
                <span className='text-xs text-gray-500'>{tx.date}</span>
              </div>
            </div>
            <div className='text-black font-semibold'>- ₹{tx.amount} CV</div>
            <div className='border rounded-[50%] bg-blue-100'>
              <TrendingUp className='w-3 h-auto m-1 text-blue-300'/>
            </div>
          </div>
        ))}
      </div>

  {/* Footer */}
  <div className='pb-4 '>
    <span className='text-sky-400 underline capitalize text-sm cursor-pointer'>
      see full history
    </span>
  </div>
        </div>

      </div>

    </div>
  )
}

export default Recharge