from geoalchemy2 import Geometry, WKBElement
from sqlalchemy import Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Region(Base):
    """Region polygons and their population data."""

    __tablename__ = "regions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    geometry: Mapped[WKBElement] = mapped_column(Geometry(geometry_type="POLYGON", srid=4326))
    population: Mapped[int] = mapped_column(Integer)
    name: Mapped[str] = mapped_column(String)
    type: Mapped[str] = mapped_column(String)
