export default async function NotFound() {
  return (
    <>
      <div className="app__home">
        <div className="bg-gray-700 pb-10 pt-32 px-6 md:flex items-start md:space-x-4 justify-center">
          <h1 className="text-white text-2xl">Page Not Found</h1>
        </div>
        <div className="mt-auto bg-gray-800 p-4 text-white fixed bottom-0 w-full">
          <div className="text-white text-center text-xs">&copy; ePRIME</div>
        </div>
      </div>
    </>
  )
}
