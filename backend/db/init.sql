-- טבלת משתמשים
CREATE TABLE IF NOT EXISTS Users (
    UserID SERIAL PRIMARY KEY,
    Username VARCHAR(255) UNIQUE NOT NULL,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- טבלת רשימת קניות מתמשכת
CREATE TABLE IF NOT EXISTS PersistentList (
    UserID INTEGER PRIMARY KEY REFERENCES Users(UserID) ON DELETE CASCADE,
    ListContent TEXT DEFAULT ''
);

-- טבלת קטגוריות
CREATE TABLE IF NOT EXISTS Categories (
    CategoryID SERIAL PRIMARY KEY,
    CategoryName VARCHAR(255) UNIQUE NOT NULL,
    Description TEXT
);

-- טבלת מוצרים
CREATE TABLE IF NOT EXISTS Products (
    ProductID SERIAL PRIMARY KEY,
    ProductName VARCHAR(255) NOT NULL,
    CategoryID INTEGER REFERENCES Categories(CategoryID),
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- הוספת קטגוריות לדוגמה
INSERT INTO Categories (CategoryName, Description) VALUES 
('מוצרי חלב', 'חלב, גבינות, יוגורטים ומוצרי חלב אחרים'),
('פירות וירקות', 'פירות וירקות טריים'),
('בשר ודגים', 'בשר טרי, עוף ודגים'),
('מצרכים יבשים', 'פסטה, אורז, קטניות'),
('משקאות', 'מים, מיצים, משקאות קלים'),
('ממתקים וחטיפים', 'שוקולד, עוגיות, חטיפים')
ON CONFLICT (CategoryName) DO NOTHING;
