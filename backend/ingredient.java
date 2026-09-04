package backend;

public class ingredient {
    String name;
    int expirationDay;
    int expirationMonth;
    int expirationYear;

    //flavors
    String type;
    String flavor;

    public ingredient(String name, int expirationDay, int expirationMonth, int expirationYear, String type, String flavor) {
        this.name = name;
        this.expirationDay = expirationDay;
        this.expirationMonth = expirationMonth;
        this.expirationYear = expirationYear;
        this.type = type;
        this.flavor = flavor;
    }

    long getExpirationDate() {
        return expirationYear * 10000 + expirationMonth * 100 + expirationDay;
    }

    String getName() {
        return name;
    }

    String getType() {
        return type;
    }

    String getFlavor() {
        return flavor;
    }
}
