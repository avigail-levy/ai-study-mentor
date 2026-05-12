// import { useState } from "react";
// import "../styles/ShoppingListPage.css";

// const ShoppingListPage = ({ userId }) => {
//   const [items, setItems] = useState([]);
//   const [showList, setShowList] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [editItem, setEditItem] = useState(null);

//   // GET list
//   const fetchShoppingList = () => {
//     console.log("00000000000000000000000000")
//     setLoading(true);
//     setShowList(true);

// fetch(`http://localhost:5000/api/list/${userId}`)
//       .then(res => res.json())
//       .then(data => setItems(data))
//       .finally(() => setLoading(false));
//   };

//   // DELETE item
//   const handleDelete = (id) => {
//     if (!window.confirm("Delete the product?")) return;

//     fetch(`http://localhost:5000/api/item/${id}`, { method: "DELETE" })
//       .then(() => {
//         setItems(items.filter(item => item.id !== id));
//       });
//   };

//   // PUT update item
//   const handleUpdate = () => {
//     fetch(`http://localhost:5000/api/item/${editItem.id}`, {
//       method: "PUT",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         item_name: editItem.item_name,
//             })
//     }).then(() => {
//       setItems(items.map(item =>
//         item.id === editItem.id ? editItem : item
//       ));
//       setEditItem(null);
//     });
//   };

//   return (
//   <div className="shopping-page" style={{ border: '2px solid blue', marginTop: '50px' }}>
//     <button
//       style={{ position: 'relative', display: 'block', margin: '20px auto', fontSize: '24px' }}
//       onClick={() => {
//         if (!showList) { fetchShoppingList(); } 
//         else { setShowList(false); }
//       }}
//     >
//       Show/Hide List (hhh)
//     </button>


//   {showList && loading && <p>Loading...</p>}
  
//   {showList && !loading && items.length === 0 && (
//     <p>No products in the list</p>
//   )}
  
//   {showList && !loading && (
//     <ul>
//       {items.map(item => (
//         <li key={item.id}>
//           <span>{item.item_name}</span>
//           <button onClick={() => setEditItem(item)}>✏️</button>
//           <button onClick={() => handleDelete(item.id)}>🗑️</button>
//         </li>
//       ))}
//     </ul>
//   )}

//   {editItem && (
//     <div className="edit-box">
//       <h3>Product update</h3>
//       <input
//         value={editItem.item_name}
//         onChange={e => setEditItem({ ...editItem, item_name: e.target.value })}
//       />
//       <button onClick={handleUpdate}>Save</button>
//       <button onClick={() => setEditItem(null)}>Cancel</button>
//     </div>
//   )}
// </div>
//   );
// };
// export default ShoppingListPage;
import { useState } from "react";
import "../styles/ShoppingListPage.css";

const ShoppingListPage = ({ userId }) => {
  const [items, setItems] = useState([]);
  const [showList, setShowList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const fetchShoppingList = () => {
    setLoading(true);
    setShowList(true);
    fetch(`http://localhost:5000/api/list/${userId}`)
      .then(res => res.json())
      .then(data => setItems(data))
      .finally(() => setLoading(false));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete the product?")) return;
    fetch(`http://localhost:5000/api/item/${id}`, { method: "DELETE" })
      .then(() => setItems(items.filter(item => item.id !== id)));
  };

  const handleUpdate = () => {
    fetch(`http://localhost:5000/api/item/${editItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_name: editItem.item_name })
    }).then(() => {
      setItems(items.map(item => item.id === editItem.id ? editItem : item));
      setEditItem(null);
    });
  };

  return (
    <div className="shopping-page-container">
      {/* כפתור הפתיחה - תמיד נגיש ומשתמש בעיצוב היפה שלך */}
      <button 
        className="show-list-btn"
        onClick={() => {
          if (!showList) fetchShoppingList();
          else setShowList(false);
        }}
      >
        {showList ? "Close List 🔼" : "Show Shopping List 🛒"}
      </button>

      {/* האזור שנסגר ונפתח */}
      <div className={`shopping-list-content ${showList ? 'visible' : ''}`}>
        
        {loading && <p className="loading-text">Loading items...</p>}
        
        {!loading && items.length === 0 && (
          <p className="empty-text">No products in the list</p>
        )}
        
        {!loading && items.length > 0 && (
          <ul className="shopping-list">
            {items.map(item => (
              <li key={item.id} className="shopping-item">
                <span className="item-name">{item.item_name}</span>
                <div className="item-buttons">
                  <button onClick={() => setEditItem(item)}>✏️</button>
                  <button onClick={() => handleDelete(item.id)}>🗑️</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {editItem && (
  <div className="edit-box">
    <h3>Update Product</h3>
    <input
      autoFocus // גורם לסמן לקפוץ ישר לתיבת הטקסט
      value={editItem.item_name}
      onChange={e => setEditItem({ ...editItem, item_name: e.target.value })}
    />
    <div className="edit-buttons">
      <button className="save-btn" onClick={handleUpdate}>Save</button>
      <button className="cancel-btn" onClick={() => setEditItem(null)}>Cancel</button>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default ShoppingListPage;