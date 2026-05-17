const bounds = L.latLngBounds(

    [35.20, 139.30],
    [35.75, 139.95]

);

const isMobile =
    window.innerWidth <= 768;

const center = isMobile

    ? [35.447, 139.615]
    : [35.447, 139.585];

const map = L.map("map", {

    minZoom: 11,
    maxZoom: 17,

    maxBounds: bounds,

    maxBoundsViscosity: 0.6,

    zoomControl: false

}).setView(

    center,
    12

);

L.control.zoom({
position: "bottomright"
}).addTo(map);

L.tileLayer(
"https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
{
attribution:
"© OpenStreetMap © CARTO"
}
).addTo(map);

function getColor(score) {

if (score === null)
    return "#9ca3af";

if (score <= -1.0)
    return "#2563eb";

if (score <= -0.3)
    return "#60a5fa";

if (score <= 0.8)
    return "#f59e0b";

return "#ef4444";

}

function getRadius(rank) {

return 7;

}

function getDaysSeenLabel(days) {

    if (days == null)
        return "-";

    if (days >= 45)
        return "長期間掲載";

    if (days >= 30)
        return "1ヶ月以上";

    if (days >= 15)
        return "2週間以上";

    return `${days}日`;
}

let listingLayer;
let allData;

fetch("data/map_data.geojson")

.then(response => response.json())

.then(data => {

allData = data;

listingLayer = L.geoJSON(data, {

    pointToLayer:
        function(feature, latlng) {

        const p = feature.properties;

        return L.circleMarker(
            latlng,
            {

                radius:
                    getRadius(
                        p.marker_rank
                    ),

                fillColor:
                    getColor(
                        p.discount_score
                    ),

                color: "#ffffff",

                weight: 1.2,

                opacity: 1,

                fillOpacity: 0.82
            }
        );
    },

    onEachFeature:
        function(feature, layer) {

        const p = feature.properties;

        const priceText =
            p.price
            ? (
                Math.round(
                    p.price / 10000
                ).toLocaleString()
                + "万円"
            )
            : "-";

        const popup = `

            <div
                style="
                    min-width:220px;
                    line-height:1.7;
                "
            >

                <div
                    style="
                        font-size:18px;
                        font-weight:700;
                        margin-bottom:10px;
                    "
                >
                    ${priceText}
                </div>

                <div>
                    ${p.ward ?? "-"}
                </div>

                <div>
                    ${p.station_name ?? "-"}
                </div>

                <hr
                    style="
                        border:none;
                        border-top:1px solid #e5e7eb;
                        margin:10px 0;
                    "
                >

                <div>
                    面積:
                    ${p.floor_area ?? "-"}㎡
                </div>

                <div>
                    徒歩:
                    ${p.walk_minutes ?? "-"}分
                </div>

                <div>
                    築年:
                    ${p.build_year ?? "-"}
                </div>

                <div>
                    市場掲載:
                    ${getDaysSeenLabel(p.days_seen)}
                </div>

                <div>
                    値下げ:
                    ${p.price_drop_count ?? 0}回
                </div>

                <div>
                    モデル:
                    ${p.discount_type ?? "-"}
                </div>

                <div>
                    スコア:
                    ${
                        p.discount_score !== null
                        ? Number(
                            p.discount_score
                        ).toFixed(2)
                        : "-"
                    }
                </div>
                
            </div>
        `;

        layer.bindPopup(popup);
    }

}).addTo(map);

});

/* =========================
   filter panel toggle
========================= */

const panel =
    document.getElementById(
        "filter-panel"
    );

const toggle =
    document.getElementById(
        "filter-toggle"
    );

let filterOpen = true;

/* toggle button */

toggle.addEventListener(
    "click",
    () => {

        filterOpen = !filterOpen;

        if (filterOpen) {

            panel.classList.remove(
                "closed"
            );

        } else {

            panel.classList.add(
                "closed"
            );
        }
    }
);

/* map click auto close */

map.on(
    "click",
    () => {

        if (filterOpen) {

            panel.classList.add(
                "closed"
            );

            filterOpen = false;
        }
    }
);

/* =========================
   filter debug
========================= */

document
    .querySelectorAll(".filter-select")
    .forEach((select, index) => {

        select.addEventListener(
            "change",
            () => {

                console.log(
                    "[FILTER CHANGE]",
                    index,
                    select.value
                );
                applyFilters();
            }
        );
    });

/* =========================
   filter process
========================= */

function applyFilters() {

    const selects =
        document.querySelectorAll(
            ".filter-select"
        );

    const areaValue =
        selects[0].value;

    const walkValue =
        selects[1].value;

    const ageValue =
        selects[2].value;

    const priceValue =
        selects[3].value;

    const filteredFeatures =
        allData.features.filter(feature => {

            const p =
                feature.properties;

            /* area filter */
                    
            if (
                areaValue !== "すべて"
            ) {
            
                if (
                    p.ward !== areaValue
                )
                    return false;
            }

            /* walk filter */

            if (
                walkValue !== "すべて"
            ) {

                const walk =
                    p.walk_minutes;

                if (walk == null)
                    return false;

                if (
                    walkValue === "10分以内"
                    && walk > 10
                )
                    return false;

                if (
                    walkValue === "15分以内"
                    && walk > 15
                )
                    return false;
            }

            /* age filter */

            if (
                ageValue !== "すべて"
            ) {
            
                const currentYear =
                    new Date().getFullYear();
            
                const age =
                    currentYear - p.build_year;
            
                if (
                    ageValue === "築10年以内"
                    && age > 10
                )
                    return false;
            
                if (
                    ageValue === "築20年以内"
                    && age > 20
                )
                    return false;
            
                if (
                    ageValue === "築30年以内"
                    && age > 30
                )
                    return false;
            }

            /* price filter */
                    
            if (
                priceValue !== "すべて"
            ) {
            
                const price =
                    p.price;
            
                if (price == null)
                    return false;
            
                if (
                    priceValue === "3000万円以下"
                    && price > 30000000
                )
                    return false;
            
                if (
                    priceValue === "5000万円以下"
                    && price > 50000000
                )
                    return false;
            
                if (
                    priceValue === "7000万円以下"
                    && price > 70000000
                )
                    return false;
            
                if (
                    priceValue === "1億円以上"
                    && price < 100000000
                )
                    return false;
            }
            return true;
        });

    const filteredData = {

        ...allData,

        features:
            filteredFeatures
    };

    listingLayer.clearLayers();

    listingLayer.addData(
        filteredData
    );
}
