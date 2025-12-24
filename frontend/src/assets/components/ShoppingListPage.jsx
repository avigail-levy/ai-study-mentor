import { useState } from "react";
import "../styles/ShoppingListPage.css";

const ShoppingListPage = ({ userId }) => {
  const [items, setItems] = useState([]);
  const [showList, setShowList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // GET list
  const fetchShoppingList = () => {
    console.log("00000000000000000000000000")
    setLoading(true);
    setShowList(true);

fetch(`http://localhost:5000/api/list/${userId}`)
      .then(res => res.json())
      .then(data => setItems(data))
      .finally(() => setLoading(false));
  };

  // DELETE item
  const handleDelete = (id) => {
    if (!window.confirm("למחוק את המוצר?")) return;

    fetch(`http://localhost:5000/api/item/${id}`, { method: "DELETE" })
      .then(() => {
        setItems(items.filter(item => item.id !== id));
      });
  };

  // PUT update item
  const handleUpdate = () => {
    fetch(`http://localhost:5000/api/item/${editItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_name: editItem.item_name,
            })
    }).then(() => {
      setItems(items.map(item =>
        item.id === editItem.id ? editItem : item
      ));
      setEditItem(null);
    });
  };

  return (
    <div className="shopping-page">
      {!showList && (
        <button onClick={fetchShoppingList}>
רשימת הקניות שלי        </button>
      )}

      {loading && <p>טוען...</p>}

      {showList && !loading && items.length === 0 && (
        <p>אין מוצרים ברשימה</p>
      )}

      {showList && !loading && (
        <ul>
          {items.map(item => (
            <li key={item.id}>
              <li>{item.item_name}</li>
              <button onClick={() => setEditItem(item)}>✏️</button>
              <button onClick={() => handleDelete(item.id)}>🗑️</button>
            </li>
          ))}
        </ul>
      )}

      {editItem && (
        <div className="edit-box">
          <h3>עדכון מוצר</h3>

          <input
            value={editItem.item_name}
            onChange={e =>
              setEditItem({ ...editItem, item_name: e.target.value })
            }
          />
          <button onClick={handleUpdate}>שמור</button>
          <button onClick={() => setEditItem(null)}>בטל</button>
        </div>
      )}
    </div>
  );
};

export default ShoppingListPage;
