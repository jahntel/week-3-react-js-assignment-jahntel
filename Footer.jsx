const Footer = () => (
  <footer className="bg-gray-200 dark:bg-gray-700 p-4 mt-auto">
    <div className="container mx-auto text-center">
      <p>&copy; {new Date().getFullYear()} My React App. All rights reserved.</p>
      <div className="space-x-4 mt-2">
        <a href="#" className="hover:text-blue-500">Privacy Policy</a>
        <a href="#" className="hover:text-blue-500">Terms of Service</a>
      </div>
    </div>
  </footer>
);

export default Footer;
