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
    if (!window.confirm("Delete the product?")) return;

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
  My Shopping List        </button>
      )}

      {loading && <p>Loading...</p>}

      {showList && !loading && items.length === 0 && (
        <p>No products in the list</p>
      )}

      {showList && !loading && (
        <ul>
          {items.map(item => (
            <li key={item.id}>
              <span>{item.item_name}</span>
              <button onClick={() => setEditItem(item)}>✏️</button>
              <button onClick={() => handleDelete(item.id)}>🗑️</button>
            </li>
          ))}
        </ul>
      )}

      {editItem && (
        <div className="edit-box">
          <h3>Product update</h3>

          <input
            value={editItem.item_name}
            onChange={e =>
              setEditItem({ ...editItem, item_name: e.target.value })
            }
          />
          <button onClick={handleUpdate}>Save</button>
          <button onClick={() => setEditItem(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};
export default ShoppingListPage;